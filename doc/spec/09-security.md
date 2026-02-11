# Security

## Overview

This document covers authentication, authorization, and security best practices for the Wine Inventory Management System.

---

## Authentication

### Supabase Auth

The application uses Supabase Authentication for user management.

```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Sign out
await supabase.auth.signOut();

// Get current session
const { data: { session } } = await supabase.auth.getSession();
```

### Session Management

- Sessions stored in browser localStorage
- JWT tokens with 1-hour expiry
- Automatic token refresh
- Session persisted across browser restarts

### Auth State

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  role: 'admin' | 'staff' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

---

## Authorization

### Role-Based Access Control (RBAC)

Two user roles with distinct permissions:

| Feature | Admin | Staff |
|---------|:-----:|:-----:|
| View wines | ✓ | ✓ |
| Add/edit wines | ✓ | ✗ |
| View current stock | ✓ | ✗ |
| Perform counts | ✓ | ✓ |
| View all history | ✓ | ✗ |
| View own history | ✓ | ✓ |
| Manage users | ✓ | ✗ |
| Configure settings | ✓ | ✗ |

### Role Assignment

```sql
-- user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Check role function
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### Frontend Route Protection

```tsx
// Protected route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}
```

---

## Row Level Security (RLS)

Supabase RLS policies enforce access at the database level.

### Wines Table

```sql
-- All authenticated users can view active wines
CREATE POLICY "View active wines"
ON wines FOR SELECT
TO authenticated
USING (is_active = true OR deleted_at IS NULL);

-- Only admins can insert/update/delete
CREATE POLICY "Admin manage wines"
ON wines FOR ALL
TO authenticated
USING (has_role('admin', auth.uid()))
WITH CHECK (has_role('admin', auth.uid()));
```

### Inventory Sessions

```sql
-- All users can create and view sessions
CREATE POLICY "Users manage own sessions"
ON inventory_sessions FOR ALL
TO authenticated
USING (
  started_by = auth.uid() OR 
  has_role('admin', auth.uid())
);

-- Only admins can approve sessions
CREATE POLICY "Admin approve sessions"
ON inventory_sessions FOR UPDATE
TO authenticated
USING (has_role('admin', auth.uid()))
WITH CHECK (has_role('admin', auth.uid()));
```

### Profiles

```sql
-- Users can view all profiles
CREATE POLICY "View all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update own profile
CREATE POLICY "Update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Only admins can update other profiles
CREATE POLICY "Admin update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (has_role('admin', auth.uid()));
```

### Audit Logs

```sql
-- Only admins can view all audit logs
CREATE POLICY "Admin view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (has_role('admin', auth.uid()));

-- Users can view own audit logs
CREATE POLICY "View own audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

---

## Environment Variables

### Required Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# OpenAI (for AI recognition)
VITE_OPENAI_API_KEY=sk-...

# Syrve (optional)
VITE_SYRVE_API_LOGIN=your_api_login
```

### Security Guidelines

1. **Never commit secrets** - Use `.env.local` (gitignored)
2. **Use environment-specific files** - `.env.development`, `.env.production`
3. **Rotate keys regularly** - Especially after team changes
4. **Limit key permissions** - Use minimal required scopes

---

## API Security

### Supabase Anon Key

The anon key is safe to expose in frontend code because:
- RLS policies control all data access
- Key only provides authenticated access
- No admin privileges without valid session

### Service Role Key (Backend Only)

```env
# NEVER expose in frontend
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

The service role key bypasses RLS and should:
- Only be used in backend/server code
- Never be committed to git
- Be stored in secure secret management

---

## Input Validation

### Frontend Validation

```typescript
// Using Zod for form validation
const wineSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  vintage: z.number().min(1900).max(2099).optional(),
  sale_price: z.number().positive().optional(),
  primary_barcode: z.string().regex(/^\d{8,14}$/).optional()
});
```

### Database Constraints

```sql
-- Check constraints
ALTER TABLE wines ADD CONSTRAINT valid_vintage 
  CHECK (vintage IS NULL OR (vintage >= 1900 AND vintage <= 2099));

ALTER TABLE wines ADD CONSTRAINT positive_price 
  CHECK (sale_price IS NULL OR sale_price > 0);

-- Not null constraints
ALTER TABLE wines ALTER COLUMN name SET NOT NULL;
```

---

## Audit Trail

All sensitive actions are logged:

```sql
-- Audit log entry
INSERT INTO audit_logs (
  user_id,
  action,
  entity_type,
  entity_id,
  entity_name,
  old_values,
  new_values,
  changed_fields,
  ip_address,
  performed_at
) VALUES (
  auth.uid(),
  'UPDATE',
  'wine',
  '123-456',
  'Château Margaux 2015',
  '{"sale_price": 400}',
  '{"sale_price": 450}',
  ARRAY['sale_price'],
  current_setting('request.headers')::json->>'x-forwarded-for',
  NOW()
);
```

### What Gets Logged

- User login/logout
- Wine create/update/delete
- Inventory session actions
- Stock adjustments
- User management actions
- Role changes
- Configuration changes

---

## Security Headers

For production deployment, configure these headers:

```nginx
# Content Security Policy
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  connect-src 'self' https://*.supabase.co https://api.openai.com;

# Other security headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=()
```

---

## Password Policy

Enforced via Supabase Auth:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

## Session Security

### Timeout Policy

- Session expires after 1 hour of inactivity
- JWT refresh happens automatically
- User prompted to re-login after expiry

### Logout

```typescript
async function logout() {
  await supabase.auth.signOut();
  useAuthStore.getState().reset();
  window.location.href = '/login';
}
```

---

## Data Protection

### Personal Data

User data stored:
- Email (required for auth)
- Name (optional)
- Phone (optional)
- Last login timestamp
- Activity history

### Data Retention

- Audit logs retained indefinitely
- Session data retained for 1 year
- Soft-deleted records retained for 90 days

---

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Appropriate RLS policies configured
- [ ] Environment variables secured
- [ ] Service role key not in frontend
- [ ] Input validation on all forms
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] Password policy enforced
- [ ] Session timeout configured
