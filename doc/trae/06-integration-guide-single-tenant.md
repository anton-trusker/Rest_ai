# Single-Tenant Integration Guide

**Updated deployment guide for single-client deployment** - simplified process with immediate compatibility.

## 🚀 Prerequisites (Unchanged)

### **Required Accounts**
- [Supabase Account](https://app.supabase.com) with organization access
- [Git](https://git-scm.com/downloads) for version control
- [Node.js](https://nodejs.org/) v18+ for development tools

### **Required Knowledge**
- Basic SQL and PostgreSQL concepts
- Supabase fundamentals (auth, RLS, Edge Functions)
- Environment variable management
- Command line interface usage

## 📋 Deployment Checklist (Simplified)

### **Phase 1: Supabase Project Setup** (10 minutes)
- [ ] Create new Supabase project
- [ ] Copy project configuration
- [ ] Set up database connection

### **Phase 2: Database Migration** (5 minutes)
- [ ] Execute single-tenant migration pack
- [ ] Verify schema deployment
- [ ] Test RLS policies

### **Phase 3: Edge Functions** (15 minutes)
- [ ] Deploy existing functions
- [ ] Deploy new functions
- [ ] Configure environment variables

### **Phase 4: Frontend Integration** (10 minutes)
- [ ] Update environment variables
- [ ] Test authentication flow
- [ ] Verify data access

### **Phase 5: Integration Testing** (20 minutes)
- [ ] Test Syrve integration
- [ ] Test AI recognition
- [ ] Test inventory workflows

## 🔧 Step-by-Step Deployment

### **Step 1: Create Supabase Project**

1. **Log in to Supabase Dashboard**
   ```bash
   # Navigate to: https://app.supabase.com
   ```

2. **Create New Project**
   - **Project Name**: `wine-inventory-prod`
   - **Database Password**: Generate strong password, save securely
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Start with Free, upgrade as needed

3. **Copy Project Configuration**
   ```bash
   # Save these values securely
   PROJECT_REF=your-project-ref
   PROJECT_URL=https://your-project-ref.supabase.co
   ANON_KEY=your-anon-key
   SERVICE_ROLE_KEY=your-service-role-key
   ```

### **Step 2: Deploy Database Schema**

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. **Login and Link Project**
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. **Deploy Single-Tenant Migration**
   ```bash
   # Use the single-tenant migration pack
   cp doc/trae/05-migration-pack-single-tenant.sql ./supabase/migrations/
   
   # Deploy to remote database
   supabase db push
   
   # Verify deployment
   supabase db migrations list
   ```

4. **Quick Verification**
   ```sql
   -- Connect to database via SQL Editor
   -- Run verification:
   SELECT COUNT(*) as table_count 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   -- Expected: 12+ tables
   ```

### **Step 3: Configure Authentication**

1. **Set up Auth Providers**
   - Auth → Providers → Email
   - Enable "Enable Email Confirmations" (recommended)

2. **Test Auth Configuration**
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

### **Step 4: Deploy Edge Functions**

1. **Deploy Existing Functions**
   ```bash
   # Copy existing functions from repo
   cp -r /Users/antonkhrabrov/Workspace/GIT/inventory_ai/supabase/functions/* ./supabase/functions/
   
   # Deploy each function
   supabase functions deploy manage-users --no-verify-jwt
   supabase functions deploy syrve-product-sync --no-verify-jwt
   supabase functions deploy syrve-inventory-commit --no-verify-jwt
   supabase functions deploy syrve-connect-test --no-verify-jwt
   supabase functions deploy ai-scan --no-verify-jwt
   ```

2. **Set Function Secrets**
   ```bash
   # Syrve API configuration
   supabase secrets set SYRVE_API_BASE_URL=https://api.syrve.com
   supabase secrets set SYRVE_TIMEOUT_MS=30000
   
   # AI service configuration
   supabase secrets set GEMINI_API_KEY=your-gemini-key
   
   # Security configuration
   supabase secrets set ENCRYPTION_KEY=your-encryption-key
   ```

3. **Verify Function Deployment**
   ```bash
   # List deployed functions
   supabase functions list
   
   # Test function endpoint
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/manage-users' \
     -H 'Authorization: Bearer your-anon-key' \
     -H 'Content-Type: application/json'
   ```

### **Step 5: Frontend Configuration**

1. **Update Environment Variables**
   ```bash
   # Create .env file in frontend project
   cat > .env << 'EOF'
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   EOF
   ```

2. **No Code Changes Required** ✅
   - Single-tenant schema maintains full compatibility
   - All existing queries work without modification
   - Synthetic email pattern continues to work
   - All compatibility views are in place

### **Step 6: Integration Testing**

#### **Syrve Integration Test**

1. **Test Syrve Connection**
   ```bash
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/syrve-connect-test' \
     -H 'Authorization: Bearer user-jwt-token' \
     -H 'Content-Type: application/json'
   ```

2. **Test Product Sync**
   ```bash
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/syrve-product-sync' \
     -H 'Authorization: Bearer user-jwt-token' \
     -H 'Content-Type: application/json' \
     -d '{"syncType": "products"}'
   ```

#### **AI Recognition Test**

1. **Test AI Scan**
   ```bash
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/ai-scan' \
     -H 'Authorization: Bearer user-jwt-token' \
     -H 'Content-Type: application/json' \
     -d '{
       "imageUrl": "https://example.com/wine-bottle.jpg",
       "sessionId": "your-session-id"
     }'
   ```

#### **Inventory Workflow Test**

1. **Create Test Session**
   ```sql
   -- Via SQL Editor
   INSERT INTO inventory_sessions (
     session_name, 
     session_type, 
     started_by
   ) VALUES (
     'Test Session',
     'full',
     (SELECT id FROM profiles WHERE login_name = 'admin')
   );
   ```

2. **Add Test Count**
   ```sql
   INSERT INTO inventory_count_events (
     session_id,
     product_id,
     counted_by,
     quantity_unopened,
     quantity_opened
   ) VALUES (
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

## 🚨 Troubleshooting (Simplified)

### **Common Issues**

| Issue | Quick Solution |
|-------|---------------|
| **RLS Policy Blocking** | Policies are simplified - check auth status |
| **Function Deployment Fails** | Verify secrets are set correctly |
| **Auth Login Fails** | Check synthetic email pattern |
| **Syrve Integration Error** | Verify API credentials |
| **AI Recognition Fails** | Check API key configuration |

### **Quick Debug Commands**
```bash
# Check function logs
supabase functions logs manage-users --follow

# Check database status
supabase db dump --schema-only

# Test connection
supabase db test-connection
```

## 📊 Performance Monitoring

### **Database Performance**
- Supabase → Database → Performance
- Check query execution times
- Monitor connection usage

### **Function Performance** 
- Edge Functions → Logs
- Monitor execution duration
- Check error rates

### **Auth Performance**
- Auth → Logs
- Monitor login success rates

## 🎯 Next Steps (Post-Deployment)

### **Immediate Actions**
1. **Configure production domain** (if needed)
2. **Set up monitoring alerts**
3. **Create backup schedule**
4. **Train users on new features**

### **Enhanced Features Available**
- ✅ Event-sourced inventory counting
- ✅ Concurrent multi-user counting
- ✅ Enhanced Syrve synchronization
- ✅ Improved AI recognition
- ✅ Better audit trails
- ✅ Performance optimizations

### **Optional Optimizations**
- Set up custom email domain
- Configure advanced monitoring
- Implement advanced analytics
- Add additional integrations

---

## ✅ Deployment Complete!

**Your single-tenant Wine Inventory Management System is now deployed with:**

- 🚀 **Zero breaking changes** - existing code works immediately
- 📈 **Enhanced capabilities** - event-sourced inventory, better Syrve sync  
- 🔒 **Improved security** - simplified RLS policies
- ⚡ **Better performance** - optimized for single-client use
- 📋 **Complete audit trail** - all inventory changes tracked

**Total deployment time: ~60 minutes** (vs 8+ weeks for multi-tenant migration)

**Next step**: Start using the enhanced features and monitor system performance.