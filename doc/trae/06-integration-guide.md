# Integration Guide

Step-by-step guide for deploying the Wine Inventory Management System to a new Supabase project with complete integration setup.

## 🚀 Prerequisites

### **Required Accounts**
- [Supabase Account](https://app.supabase.com) with organization access
- [Git](https://git-scm.com/downloads) for version control
- [Node.js](https://nodejs.org/) v18+ for development tools
- [Docker](https://docker.com) (optional, for local development)

### **Required Knowledge**
- Basic SQL and PostgreSQL concepts
- Supabase fundamentals (auth, RLS, Edge Functions)
- Environment variable management
- Command line interface usage

## 📋 Deployment Checklist

### **Phase 1: Supabase Project Setup** (15 minutes)
- [ ] Create new Supabase project
- [ ] Configure project settings
- [ ] Generate API keys
- [ ] Set up database connection

### **Phase 2: Database Migration** (10 minutes)
- [ ] Execute migration pack
- [ ] Verify schema deployment
- [ ] Test RLS policies
- [ ] Create initial admin user

### **Phase 3: Edge Functions** (20 minutes)
- [ ] Deploy existing functions
- [ ] Deploy new functions
- [ ] Configure environment variables
- [ ] Test function endpoints

### **Phase 4: Frontend Integration** (15 minutes)
- [ ] Update environment variables
- [ ] Test authentication flow
- [ ] Verify data access
- [ ] Test core workflows

### **Phase 5: Integration Testing** (30 minutes)
- [ ] Test Syrve integration
- [ ] Test AI recognition
- [ ] Test inventory workflows
- [ ] Validate multi-tenancy

## 🔧 Step-by-Step Deployment

### **Step 1: Create Supabase Project**

1. **Log in to Supabase Dashboard**
   ```bash
   # Navigate to: https://app.supabase.com
   # Sign in with your account
   ```

2. **Create New Project**
   - Click "New Project"
   - **Project Name**: `wine-inventory-prod`
   - **Database Password**: Generate strong password, save securely
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free, upgrade as needed

3. **Wait for Project Initialization**
   - Takes 2-3 minutes
   - Project status will show "Active" when ready

### **Step 2: Configure Project Settings**

1. **Navigate to Project Settings**
   - Click project name → Settings → General

2. **Copy Project Configuration**
   ```bash
   # Save these values securely
   PROJECT_REF=your-project-ref
   PROJECT_URL=https://your-project-ref.supabase.co
   ANON_KEY=your-anon-key
   SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Configure Database Settings**
   - Settings → Database → Connection Pooling
   - Enable connection pooling (recommended for production)
   - Note connection string for external tools

### **Step 3: Deploy Database Schema**

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase CLI**
   ```bash
   supabase login
   # Follow authentication flow
   ```

3. **Initialize Local Project** (optional, for development)
   ```bash
   supabase init
   # Creates supabase directory with config
   ```

4. **Link to Remote Project**
   ```bash
   supabase link --project-ref your-project-ref
   # Use PROJECT_REF from Step 2
   ```

5. **Deploy Migration Pack**
   ```bash
   # Copy migration file to local project
   cp doc/trae/05-migration-pack.sql ./supabase/migrations/
   
   # Deploy to remote database
   supabase db push
   
   # Verify deployment
   supabase db migrations list
   ```

6. **Verify Schema Deployment**
   ```sql
   -- Connect to database via SQL Editor
   -- Run verification queries:
   
   SELECT COUNT(*) as table_count 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   -- Expected: 15+ tables
   
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'inventory_%';
   -- Expected: inventory_sessions, inventory_count_events, etc.
   ```

### **Step 4: Configure Authentication**

1. **Set up Auth Providers**
   - Auth → Providers → Email
   - Enable "Enable Email Confirmations" (recommended)
   - Configure email templates if needed

2. **Configure Password Policy**
   - Auth → Policies → Password Policy
   - Set minimum length: 8 characters
   - Enable complexity requirements

3. **Test Auth Configuration**
   ```bash
   # Test with curl
   curl -X POST 'https://your-project-ref.supabase.co/auth/v1/token' \
     -H 'apikey: your-anon-key' \
     -H 'Content-Type: application/json' \
     -d '{
       "email": "test@inventory.local",
       "password": "test123456"
     }'
   ```

### **Step 5: Deploy Edge Functions**

1. **Create Functions Directory**
   ```bash
   mkdir -p supabase/functions
   cd supabase/functions
   ```

2. **Deploy Existing Functions**
   ```bash
   # Copy existing functions from repo
   cp -r /Users/antonkhrabrov/Workspace/GIT/inventory_ai/supabase/functions/* ./
   
   # Deploy each function
   supabase functions deploy manage-users --no-verify-jwt
   supabase functions deploy syrve-product-sync --no-verify-jwt
   supabase functions deploy syrve-inventory-commit --no-verify-jwt
   supabase functions deploy syrve-connect-test --no-verify-jwt
   supabase functions deploy ai-scan --no-verify-jwt
   ```

3. **Deploy New Functions** (create these files)
   ```bash
   # Create syrve-save-config
   mkdir syrve-save-config
   cat > syrve-save-config/index.ts << 'EOF'
   // Content from 04-edge-functions-spec.md
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   // ... rest of implementation
   EOF
   
   # Deploy new functions
   supabase functions deploy syrve-save-config --no-verify-jwt
   supabase functions deploy inventory-outbox-processor --no-verify-jwt
   supabase functions deploy ai-scan-enhanced --no-verify-jwt
   ```

4. **Verify Function Deployment**
   ```bash
   # List deployed functions
   supabase functions list
   
   # Test function endpoint
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/manage-users' \
     -H 'Authorization: Bearer your-anon-key' \
     -H 'Content-Type: application/json'
   ```

### **Step 6: Configure Environment Variables**

1. **Set Function Secrets**
   ```bash
   # Syrve API configuration
   supabase secrets set SYRVE_API_BASE_URL=https://api.syrve.com
   supabase secrets set SYRVE_TIMEOUT_MS=30000
   
   # AI service configuration
   supabase secrets set GEMINI_API_KEY=your-gemini-key
   supabase secrets set OPENAI_API_KEY=your-openai-key
   
   # Security configuration
   supabase secrets set ENCRYPTION_KEY=your-encryption-key
   supabase secrets set RATE_LIMIT_ENABLED=true
   ```

2. **Update Frontend Environment**
   ```bash
   # Create .env file in frontend project
   cat > .env << 'EOF'
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   EOF
   ```

3. **Configure CORS Settings**
   - Edge Functions → Settings → CORS
   - Add your frontend domains
   - Configure allowed methods and headers

### **Step 7: Test Core Functionality**

1. **Test Authentication Flow**
   ```bash
   # Create test user via Edge Function
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/manage-users' \
     -H 'Authorization: Bearer your-anon-key' \
     -H 'Content-Type: application/json' \
     -d '{
       "action": "create",
       "loginName": "testuser",
       "fullName": "Test User",
       "password": "test123456",
       "roleId": "role-id-from-database"
     }'
   ```

2. **Test Login**
   ```bash
   # Login with synthetic email
   curl -X POST 'https://your-project-ref.supabase.co/auth/v1/token' \
     -H 'apikey: your-anon-key' \
     -H 'Content-Type: application/json' \
     -d '{
       "email": "testuser@inventory.local",
       "password": "test123456"
     }'
   ```

3. **Test Data Access**
   ```bash
   # Test RLS policies
   curl -X GET 'https://your-project-ref.supabase.co/rest/v1/products' \
     -H 'apikey: your-anon-key' \
     -H 'Authorization: Bearer user-jwt-token'
   ```

## 🔍 Integration Testing

### **Syrve Integration Test**

1. **Configure Syrve Settings**
   ```bash
   # Via Edge Function
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/syrve-save-config' \
     -H 'Authorization: Bearer user-jwt-token' \
     -H 'Content-Type: application/json' \
     -d '{
       "clientId": "your-syrve-client-id",
       "apiLogin": "your-syrve-login",
       "apiPassword": "your-syrve-password",
       "syncEnabled": true,
       "syncFrequency": "hourly"
     }'
   ```

2. **Test Syrve Connection**
   ```bash
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/syrve-connect-test' \
     -H 'Authorization: Bearer user-jwt-token' \
     -H 'Content-Type: application/json'
   ```

3. **Test Product Sync**
   ```bash
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/syrve-product-sync' \
     -H 'Authorization: Bearer user-jwt-token' \
     -H 'Content-Type: application/json' \
     -d '{"syncType": "products"}'
   ```

### **AI Recognition Test**

1. **Configure AI Settings**
   ```bash
   # Configure AI provider
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/ai-config' \
     -H 'Authorization: Bearer user-jwt-token' \
     -H 'Content-Type: application/json' \
     -d '{
       "provider": "gemini",
       "model": "gemini-1.5-flash",
       "apiKey": "your-gemini-key",
       "confidenceThreshold": 0.8
     }'
   ```

2. **Test AI Scan**
   ```bash
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/ai-scan-enhanced' \
     -H 'Authorization: Bearer user-jwt-token' \
     -H 'Content-Type: application/json' \
     -d '{
       "imageUrl": "https://example.com/wine-bottle.jpg",
       "sessionId": "your-session-id"
     }'
   ```

### **Inventory Workflow Test**

1. **Create Inventory Session**
   ```sql
   -- Via SQL Editor
   INSERT INTO inventory_sessions (
     business_id, 
     session_name, 
     session_type, 
     started_by
   ) VALUES (
     (SELECT id FROM business_profile WHERE slug = 'default'),
     'Test Session',
     'full',
     (SELECT id FROM profiles WHERE login_name = 'admin')
   );
   ```

2. **Add Inventory Count**
   ```sql
   INSERT INTO inventory_count_events (
     business_id,
     session_id,
     product_id,
     counted_by,
     quantity_unopened,
     quantity_opened
   ) VALUES (
     (SELECT id FROM business_profile WHERE slug = 'default'),
     'your-session-id',
     'your-product-id',
     (SELECT id FROM profiles WHERE login_name = 'admin'),
     12,
     2
   );
   ```

3. **Verify Aggregates**
   ```sql
   SELECT * FROM inventory_product_aggregates 
   WHERE session_id = 'your-session-id';
   ```

## 🚨 Troubleshooting

### **Common Issues**

| Issue | Solution |
|-------|----------|
| **RLS Policy Blocking Queries** | Check business_id filtering in queries |
| **Function Deployment Fails** | Verify secrets are set correctly |
| **Auth Login Fails** | Check synthetic email pattern |
| **Syrve Integration Error** | Verify API credentials and network access |
| **AI Recognition Fails** | Check API key and rate limits |

### **Debug Commands**

```bash
# Check function logs
supabase functions logs manage-users --follow

# Check database connection
supabase db dump --schema-only

# Test RLS policies
supabase db test-rls

# Check migration status
supabase db migrations list
```

### **Performance Monitoring**

1. **Database Performance**
   - Supabase → Database → Performance
   - Check slow query logs
   - Monitor connection pool usage

2. **Function Performance**
   - Edge Functions → Logs
   - Monitor execution time
   - Check error rates

3. **Auth Performance**
   - Auth → Logs
   - Monitor login success rates
   - Check for suspicious activity

## 📊 Post-Deployment Verification

### **Security Checklist**
- [ ] RLS policies are active on all tables
- [ ] Service role keys are secure
- [ ] Function endpoints require authentication
- [ ] Multi-tenant isolation is working
- [ ] Admin functions require admin permissions

### **Performance Checklist**
- [ ] Database indexes are created
- [ ] Functions respond within 5 seconds
- [ ] No excessive API calls
- [ ] Connection pooling is enabled
- [ ] Rate limiting is configured

### **Integration Checklist**
- [ ] Syrve sync completes successfully
- [ ] AI recognition returns results
- [ ] Inventory counting works end-to-end
- [ ] User management functions properly
- [ ] Audit logs are being created

## 🎯 Next Steps

1. **Configure Production Domain**
   - Set up custom domain for Supabase
   - Configure SSL certificates
   - Update CORS settings

2. **Set up Monitoring**
   - Configure alerts for errors
   - Set up performance monitoring
   - Create backup schedules

3. **User Training**
   - Train staff on new system
   - Create user documentation
   - Set up support channels

4. **Gradual Migration**
   - Start with pilot users
   - Monitor system performance
   - Gradually migrate all users

---

**Next Step**: Review the [code migration checklist](07-code-migration-checklist.md) for updating frontend code to use the new schema.