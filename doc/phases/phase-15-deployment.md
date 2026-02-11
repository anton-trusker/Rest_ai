# Phase 15: Deployment

## Overview

Deploy the application to production with proper environment configuration.

---

## Environment Setup

### `.env.production`

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Feature flags
VITE_ENABLE_AI_RECOGNITION=true
VITE_ENABLE_SYRVE_SYNC=true
```

---

## Build Commands

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck

# Run tests
npm run test
```

---

## Deployment Platforms

### Vercel

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Pre-Deploy Checklist

### Code Quality
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] ESLint warnings resolved
- [ ] Bundle size acceptable

### Database
- [ ] All migrations applied
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] Seed data loaded

### Security
- [ ] Environment variables set
- [ ] API keys rotated
- [ ] CORS configured
- [ ] Rate limiting enabled

### Edge Functions
- [ ] Functions deployed
- [ ] Secrets configured
- [ ] Error logging enabled

---

## Post-Deploy Verification

```bash
# 1. Check application loads
curl -I https://your-app.vercel.app

# 2. Test login
# (Manual browser test)

# 3. Check API connection
# (View browser network tab)

# 4. Verify edge functions
supabase functions list --project-ref your-project-id
```

---

## Monitoring

### Supabase Dashboard
- Database performance
- Edge function logs
- Auth usage
- Storage quota

### Application
- Error tracking (error_logs table)
- Audit logs
- Performance metrics

---

## Rollback Procedure

1. Revert Vercel/Netlify to previous deployment
2. If database migration issue:
   ```sql
   -- Check current version
   SELECT * FROM supabase_migrations.schema_migrations;
   
   -- Rollback if needed (manual)
   ```
3. Notify users if extended downtime

---

## Summary

All 15 phases complete the full implementation cycle from database setup through production deployment.
