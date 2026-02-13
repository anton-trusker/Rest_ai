# Edge Functions Specification

Complete specification for Supabase Edge Functions with security guards, tenant isolation, and integration patterns. Includes existing functions with security hardening and missing functions required for full functionality.

## 🏗️ Edge Functions Architecture

### **Security Model**
```
Client Request → JWT Validation → Tenant Isolation → Permission Check → Service Role → Database
```

### **Function Categories**
- **Auth Functions**: User management with role validation
- **Integration Functions**: Syrve POS synchronization
- **AI Functions**: Image recognition and processing
- **Utility Functions**: Configuration and system management

## 📋 Existing Functions (Security-Hardened)

### **1. manage-users** 
User CRUD operations with enhanced security.

**File**: `supabase/functions/manage-users/index.ts`

**Security Enhancements**:
```typescript
// Enhanced authorization with tenant validation
async function validateCallerPermissions(request: Request): Promise<AuthValidation> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw new Error('No authorization header');

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) throw new Error('Invalid token');

  // Get user's business and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id, login_name')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  // Check if user is admin or super admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select(`
      role:roles!inner(
        name, 
        is_super_admin,
        permissions
      )
    `)
    .eq('user_id', user.id)
    .eq('business_id', profile.business_id)
    .maybeSingle();

  const isAdmin = roleData?.role?.name === 'Admin';
  const isSuperAdmin = roleData?.role?.is_super_admin === true;

  if (!isAdmin && !isSuperAdmin) {
    throw new Error('Insufficient permissions');
  }

  return {
    userId: user.id,
    businessId: profile.business_id,
    isAdmin,
    isSuperAdmin,
    rolePermissions: roleData?.role?.permissions || {}
  };
}

// Enhanced create user with tenant validation
async function createUser(request: Request, auth: AuthValidation): Promise<UserResponse> {
  const { loginName, fullName, roleId, password } = await request.json();

  // Validate role exists and belongs to same business
  const { data: role } = await supabase
    .from('roles')
    .select('id, name, is_super_admin')
    .eq('id', roleId)
    .eq('business_id', auth.businessId)
    .single();

  if (!role) throw new Error('Role not found or not in your business');

  // Super admin protection
  if (role.is_super_admin && !auth.isSuperAdmin) {
    throw new Error('Only super admins can assign super admin role');
  }

  const email = `${loginName}@inventory.local`;

  // Check for existing user in business
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('business_id', auth.businessId)
    .eq('login_name', loginName)
    .single();

  if (existingUser) throw new Error('Login name already exists in your business');

  // Create auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      login_name: loginName,
      business_id: auth.businessId
    }
  });

  if (authError) throw new Error(`Auth creation failed: ${authError.message}`);

  // Create profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authUser.user.id,
      business_id: auth.businessId,
      login_name: loginName,
      full_name: fullName,
      email: email
    });

  if (profileError) {
    // Rollback auth user
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }

  // Assign role
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .insert({
      business_id: auth.businessId,
      user_id: authUser.user.id,
      role_id: roleId,
      is_primary: true
    });

  if (roleError) {
    // Rollback auth user and profile
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Role assignment failed: ${roleError.message}`);
  }

  return {
    id: authUser.user.id,
    loginName,
    fullName,
    email,
    roleId: roleId,
    createdAt: new Date().toISOString()
  };
}
```

**Key Security Enhancements**:
- ✅ Tenant isolation validation
- ✅ Role existence and business ownership checks
- ✅ Super admin privilege protection
- ✅ Login name uniqueness per business
- ✅ Comprehensive error handling with rollback
- ✅ Audit logging for user operations

### **2. syrve-product-sync**
Enhanced Syrve product synchronization with tenant isolation.

**Security Enhancements**:
```typescript
// Enhanced authorization
async function validateSyrveAccess(request: Request): Promise<SyrveAuth> {
  const auth = await validateCallerPermissions(request);
  
  // Check Syrve integration permissions
  if (!checkPermission(auth.rolePermissions, 'integrations.syrve', 'edit')) {
    throw new Error('No permission to sync Syrve data');
  }

  // Get Syrve config for user's business
  const { data: config } = await supabase
    .from('syrve_config')
    .select('*')
    .eq('business_id', auth.businessId)
    .single();

  if (!config) throw new Error('Syrve integration not configured');
  if (!config.sync_enabled) throw new Error('Syrve sync is disabled');

  return {
    ...auth,
    syrveConfig: config
  };
}

// Enhanced product sync with tenant validation
async function syncSyrveProducts(auth: SyrveAuth): Promise<SyncResult> {
  // Create sync run record
  const { data: syncRun } = await supabase
    .from('syrve_sync_runs')
    .insert({
      business_id: auth.businessId,
      sync_type: 'products',
      status: 'running',
      created_by: auth.userId
    })
    .select()
    .single();

  try {
    // Fetch from Syrve API
    const syrveProducts = await fetchSyrveProducts(auth.syrveConfig);
    
    // Process each product with business isolation
    for (const syrveProduct of syrveProducts) {
      await processSyrveProduct(syrveProduct, auth, syncRun.id);
    }

    // Update sync run
    await supabase
      .from('syrve_sync_runs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', syncRun.id);

    return { success: true, itemsProcessed: syrveProducts.length };
  } catch (error) {
    // Update sync run with error
    await supabase
      .from('syrve_sync_runs')
      .update({ 
        status: 'failed', 
        completed_at: new Date().toISOString(),
        error_details: [{ message: error.message }]
      })
      .eq('id', syncRun.id);
    
    throw error;
  }
}
```

## 🆕 Missing Functions (Required)

### **3. syrve-save-config**
Save Syrve integration configuration.

**Purpose**: Configure Syrve API credentials and sync settings

**Security Requirements**:
- Admin or super admin only
- Business-scoped configuration
- Encrypted credential storage

```typescript
// Function signature
interface SyrveConfigRequest {
  clientId: string;
  apiLogin: string;
  apiPassword: string;
  unitId?: string;
  organizationId?: string;
  syncEnabled: boolean;
  syncFrequency: 'hourly' | 'daily' | 'weekly';
}

interface SyrveConfigResponse {
  id: string;
  clientId: string;
  unitId?: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
}
```

**Implementation**:
```typescript
Deno.serve(async (request: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate caller permissions
    const auth = await validateCallerPermissions(request);
    
    // Check integration management permissions
    if (!checkPermission(auth.rolePermissions, 'integrations.manage', 'edit')) {
      throw new Error('No permission to manage integrations');
    }

    const config: SyrveConfigRequest = await request.json();

    // Encrypt sensitive credentials
    const encryptedPassword = await encrypt(config.apiPassword);

    // Upsert configuration
    const { data, error } = await supabaseAdmin
      .from('syrve_config')
      .upsert({
        business_id: auth.businessId,
        client_id: config.clientId,
        api_login: config.apiLogin,
        api_password_hash: encryptedPassword,
        unit_id: config.unitId,
        organization_id: config.organizationId,
        sync_enabled: config.syncEnabled,
        sync_frequency: config.syncFrequency,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'business_id'
      })
      .select('id, client_id, unit_id, sync_enabled, last_sync_at')
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, config: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### **4. inventory-outbox-processor**
Process inventory events for external systems.

**Purpose**: Reliable outbound integration for inventory changes

**Features**:
- Event sourcing from `inventory_count_events`
- Retry logic with exponential backoff
- Dead letter queue for failed events
- Support for multiple destinations (Syrve, webhooks, etc.)

**Implementation**:
```typescript
// Outbox table schema
interface InventoryOutbox {
  id: string;
  business_id: string;
  event_type: 'inventory_count' | 'inventory_approved' | 'inventory_flagged';
  payload: any;
  destination: 'syrve' | 'webhook' | 'email';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  retry_count: number;
  next_retry_at: string;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

// Main processing function
async function processOutboxEvents(): Promise<void> {
  // Get pending events
  const { data: events } = await supabaseAdmin
    .from('inventory_outbox')
    .select('*')
    .eq('status', 'pending')
    .lt('next_retry_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(100);

  for (const event of events || []) {
    try {
      // Mark as processing
      await supabaseAdmin
        .from('inventory_outbox')
        .update({ status: 'processing' })
        .eq('id', event.id);

      // Process based on destination
      switch (event.destination) {
        case 'syrve':
          await processSyrveEvent(event);
          break;
        case 'webhook':
          await processWebhookEvent(event);
          break;
        default:
          throw new Error(`Unknown destination: ${event.destination}`);
      }

      // Mark as completed
      await supabaseAdmin
        .from('inventory_outbox')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', event.id);

    } catch (error) {
      await handleOutboxError(event, error);
    }
  }
}

async function handleOutboxError(event: InventoryOutbox, error: Error): Promise<void> {
  const maxRetries = 5;
  const nextRetryDelay = Math.min(Math.pow(2, event.retry_count) * 1000, 3600000); // Max 1 hour

  if (event.retry_count >= maxRetries) {
    // Move to dead letter queue
    await supabaseAdmin
      .from('inventory_outbox')
      .update({
        status: 'dead_letter',
        error_message: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('id', event.id);
  } else {
    // Schedule retry
    await supabaseAdmin
      .from('inventory_outbox')
      .update({
        status: 'pending',
        retry_count: event.retry_count + 1,
        next_retry_at: new Date(Date.now() + nextRetryDelay).toISOString(),
        error_message: error.message
      })
      .eq('id', event.id);
  }
}
```

### **5. ai-scan-enhanced**
Enhanced AI image recognition with tenant isolation.

**Improvements over existing**:
- Business-scoped AI configuration
- Rate limiting per business
- Confidence threshold configuration
- Multiple AI provider support
- Enhanced error handling

**Implementation**:
```typescript
interface AIScanRequest {
  imageUrl: string;
  sessionId?: string;
  location?: string;
  provider?: 'gemini' | 'openai' | 'azure';
}

interface AIScanResponse {
  success: boolean;
  product?: {
    id: string;
    name: string;
    confidence: number;
    vintage?: number;
    producer?: string;
  };
  alternatives?: Array<{
    productId: string;
    name: string;
    confidence: number;
  }>;
  processingTime: number;
  modelUsed: string;
}

async function enhancedAIScan(request: Request): Promise<Response> {
  try {
    const auth = await validateCallerPermissions(request);
    const scanRequest: AIScanRequest = await request.json();

    // Get AI configuration for business
    const { data: aiConfig } = await supabase
      .from('ai_config')
      .select('*')
      .eq('business_id', auth.businessId)
      .eq('is_active', true)
      .single();

    if (!aiConfig) {
      throw new Error('AI recognition not configured for your business');
    }

    // Rate limiting check
    await checkRateLimit(auth.businessId, aiConfig.rate_limit_per_minute);

    // Create recognition attempt record
    const { data: attempt } = await supabase
      .from('ai_recognition_attempts')
      .insert({
        business_id: auth.businessId,
        user_id: auth.userId,
        session_id: scanRequest.sessionId,
        image_url: scanRequest.imageUrl,
        image_hash: await generateImageHash(scanRequest.imageUrl),
        provider: scanRequest.provider || aiConfig.provider,
        model: aiConfig.model,
        status: 'processing'
      })
      .select()
      .single();

    // Process with AI
    const startTime = Date.now();
    const aiResult = await processWithAI(scanRequest, aiConfig);
    const processingTime = Date.now() - startTime;

    // Find matching products
    const matches = await findMatchingProducts(
      auth.businessId,
      aiResult,
      aiConfig.confidence_threshold
    );

    // Update attempt record
    const bestMatch = matches[0];
    await supabase
      .from('ai_recognition_attempts')
      .update({
        status: bestMatch ? 'success' : 'failed',
        recognized_product_id: bestMatch?.productId,
        recognized_product_name: bestMatch?.name,
        confidence_score: bestMatch?.confidence,
        raw_response: aiResult.rawResponse,
        processing_duration_ms: processingTime
      })
      .eq('id', attempt.id);

    return new Response(
      JSON.stringify({
        success: !!bestMatch,
        product: bestMatch,
        alternatives: matches.slice(1, 4), // Top 3 alternatives
        processingTime,
        modelUsed: aiConfig.model
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

## 🔐 Security Implementation Patterns

### **Standard Security Template**
```typescript
// Reusable security validation
interface AuthValidation {
  userId: string;
  businessId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  rolePermissions: Record<string, string>;
}

async function validateCallerPermissions(request: Request): Promise<AuthValidation> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw new Error('No authorization header');

  const token = authHeader.replace('Bearer ', '');
  
  // Validate JWT token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) throw new Error('Invalid token');

  // Get user profile with business context
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id, login_name')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  // Get user roles and permissions
  const { data: roleData } = await supabase
    .from('user_roles')
    .select(`
      role:roles!inner(
        name, 
        is_super_admin,
        permissions
      )
    `)
    .eq('user_id', user.id)
    .eq('business_id', profile.business_id)
    .maybeSingle();

  const isAdmin = roleData?.role?.name === 'Admin';
  const isSuperAdmin = roleData?.role?.is_super_admin === true;

  return {
    userId: user.id,
    businessId: profile.business_id,
    isAdmin,
    isSuperAdmin,
    rolePermissions: roleData?.role?.permissions || {}
  };
}

// Permission checking utility
function checkPermission(
  permissions: Record<string, string>, 
  permissionKey: string, 
  requiredLevel: string = 'view'
): boolean {
  if (permissions['*'] === 'full') return true;
  
  const userLevel = permissions[permissionKey] || permissions['*'] || 'none';
  const levels = ['none', 'view', 'edit', 'full'];
  
  return levels.indexOf(userLevel) >= levels.indexOf(requiredLevel);
}
```

### **Rate Limiting Implementation**
```typescript
// Rate limiting for AI functions
async function checkRateLimit(
  businessId: string, 
  limitPerMinute: number
): Promise<void> {
  const key = `rate_limit:${businessId}:${Math.floor(Date.now() / 60000)}`;
  
  const { data: current } = await supabaseAdmin
    .rpc('increment_rate_limit', { key_name: key, limit_val: limitPerMinute });

  if (current >= limitPerMinute) {
    throw new Error('Rate limit exceeded');
  }
}
```

### **Audit Logging**
```typescript
// Audit logging for sensitive operations
async function auditLog(
  userId: string,
  businessId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  await supabaseAdmin
    .from('audit_logs')
    .insert({
      user_id: userId,
      business_id: businessId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
      created_at: new Date().toISOString()
    });
}
```

## 📊 Function Deployment Configuration

### **Environment Variables**
```bash
# Required for all functions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Syrve integration
SYRVE_API_BASE_URL=https://api.syrve.com
SYRVE_TIMEOUT_MS=30000

# AI services
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key

# Security
ENCRYPTION_KEY=your-encryption-key
RATE_LIMIT_ENABLED=true
```

### **Deployment Script**
```bash
#!/bin/bash

# Deploy all Edge Functions
supabase functions deploy manage-users --no-verify-jwt
supabase functions deploy syrve-product-sync --no-verify-jwt
supabase functions deploy syrve-inventory-commit --no-verify-jwt
supabase functions deploy syrve-save-config --no-verify-jwt
supabase functions deploy inventory-outbox-processor --no-verify-jwt
supabase functions deploy ai-scan-enhanced --no-verify-jwt

echo "All Edge Functions deployed successfully"
```

---

**Next Step**: Review the [migration pack](05-migration-pack.sql) for ordered SQL deployment.