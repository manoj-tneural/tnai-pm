# TNAI PM - Custom Authentication Migration - COMPLETION GUIDE

## 🎉 What Has Been Completed

### Backend Authentication System ✅ COMPLETE
- **lib/db.ts** - PostgreSQL connection pooling
- **lib/auth.ts** - Password hashing (bcrypt) & JWT token creation
- **lib/auth-jwt.ts** - JWT verification (middleware-safe, no bcrypt)
- **app/api/auth/login/route.ts** - Login endpoint with password verification
- **app/api/auth/signup/route.ts** - Signup endpoint with validation
- **app/api/auth/logout/route.ts** - Logout endpoint
- **app/api/admin/users/[id]/route.ts** - Admin role update endpoint

### Frontend Auth Pages ✅ COMPLETE
- **app/auth/login/page.tsx** - Updated to use /api/auth/login
- **app/auth/signup/page.tsx** - Updated to use /api/auth/signup
- Removed all Supabase SDK references

### Route Protection ✅ COMPLETE
- **middleware.ts** - Validates JWT tokens on protected routes
- Automatic redirect to /auth/login for unauthenticated users
- Token expiration handling

### Sidebar & Components ✅ PARTIAL
- **components/Sidebar.tsx** - Updated to use /api/auth/logout
- Removed Supabase client initialization

### Database & Configuration ✅ COMPLETE
- **supabase/migrations/002_custom_auth.sql** - Adds password_hash column
- **.env.example** - Updated with JWT and database variables
- **package.json** - Dependencies updated (bcrypt, jsonwebtoken, pg)

### Documentation ✅ COMPLETE
- **CUSTOM_AUTH_README.md** - Comprehensive auth system guide
- **AUTH_MIGRATION_STATUS.md** - Migration checklist and patterns

### Initial Pages ✅ PARTIAL
- **app/page.tsx** - Updated to check JWT token instead of Supabase
- **app/(app)/admin/page.tsx** - Updated with database queries
- **app/(app)/admin/RoleChanger.tsx** - Uses new /api/admin/users endpoint
- **app/(app)/daily/page.tsx** - Converted to database queries
- **app/(app)/products/[slug]/daily/page.tsx** - Converted to database queries
- **app/(app)/dashboard/page.tsx** - Converted to database queries (with some SQL syntax)

## ⚠️ Remaining Work

### Pages Still Needing Migration (8 files)

The following pages still have Supabase imports and need to be updated with direct PostgreSQL queries:

1. **app/(app)/products/[slug]/deployments/[id]/page.tsx**
2. **app/(app)/products/[slug]/deployments/page.tsx**
3. **app/(app)/products/[slug]/deployments/NewDeploymentButton.tsx**
4. **app/(app)/products/[slug]/deployments/[id]/TaskStatusToggle.tsx**
5. **app/(app)/products/[slug]/dev-tasks/page.tsx**
6. **app/(app)/products/page.tsx** (likely)
7. **app/(app)/tickets/page.tsx** (likely)
8. Any other component files under app/(app)/ using Supabase

### Build Status

**Current:** Build fails with Type errors about `supabase.from()` not existing.
- Reason: Stub Supabase files only throw errors, don't provide actual methods

**Workaround:** Replace all remaining Supabase calls with database queries following the patterns below.

## 🔧 How to Complete the Migration

### For Each Remaining Page

#### Step 1: Update Imports
```typescript
// ❌ REMOVE
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@/lib/supabase';

// ✅ ADD
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-jwt';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
```

#### Step 2: Get Authenticated User
```typescript
// ❌ OLD
const supabase = createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/auth/login');

// ✅ NEW
const cookieStore = await cookies();
const token = cookieStore.get('auth_token')?.value;
if (!token) redirect('/auth/login');

const decoded = verifyToken(token);
if (!decoded) redirect('/auth/login');
// Now use: decoded.userId, decoded.email, decoded.role
```

#### Step 3: Convert Supabase Queries to SQL
```typescript
// ❌ OLD Supabase pattern
const { data: products } = await supabase
  .from('products')
  .select('*')
  .order('name');

// ✅ NEW PostgreSQL pattern
const result = await query('SELECT * FROM products ORDER BY name');
const products: Array<any> = result.rows;
```

#### Step 4: Handle Joins and Filters
```typescript
// ❌ OLD
supabase
  .from('deployments')
  .select('*, products(name, slug)')
  .eq('status', 'active')
  .order('created_at', { ascending: false })

// ✅ NEW
const result = await query(`
  SELECT deployments.*, products.name, products.slug
  FROM deployments
  JOIN products ON deployments.product_id = products.id
  WHERE deployments.status = $1
  ORDER BY deployments.created_at DESC
`, ['active']);
const deployments: Array<any> = result.rows;
```

#### Step 5: For Client-Side Components (Client Components)
Use API endpoints instead of direct Supabase calls:

```typescript
// ❌ OLD
'use client';
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const { data } = await supabase.from('table').update({...}).eq('id', id);

// ✅ NEW - Create an API endpoint
'use client';
const response = await fetch(`/api/items/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* data */ }),
});
```

## 📋 Remaining Pages Quick Reference

### Priority 1: Core Features (Fix these first)
- `products/[slug]/deployments/page.tsx` - List all deployments
- `products/[slug]/deployments/[id]/page.tsx` - Deployment details
- `tickets/page.tsx` (not listed but likely needed)

### Priority 2: Supporting Features
- `products/[slug]/dev-tasks/page.tsx` - Dev task listing
- `products/page.tsx` - Products listing
- `products/[slug]/deployments/NewDeploymentButton.tsx` - Client component
- `products/[slug]/deployments/[id]/TaskStatusToggle.tsx` - Client component

## 🚀 Deployment Checklist

Before deploying to EC2, ensure:

- [ ] All pages updated to use lib/db.ts instead of Supabase
- [ ] `npm run build` completes successfully with no errors
- [ ] Environment variables set: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET
- [ ] Migration `002_custom_auth.sql` run on EC2 PostgreSQL
- [ ] Test signup flow: /auth/signup
- [ ] Test login flow: /auth/login
- [ ] Navigate to /dashboard (verify data loads)
- [ ] Verify auth_token cookie is set with HttpOnly flag
- [ ] Logout and verify redirect to /auth/login

## 📚 Quick SQL Query Examples

### Get User with Profile Info
```sql
SELECT profiles.*, COUNT(tickets.id) as open_tickets
FROM profiles
LEFT JOIN tickets ON profiles.id = tickets.assignee_id AND tickets.status = 'open'
WHERE profiles.id = $1
GROUP BY profiles.id
```

### Get Products with Feature Count
```sql
SELECT 
  p.id, p.name, p.slug, p.icon, p.color,
  COUNT(f.id) as total_features,
  COUNT(CASE WHEN f.status = 'completed' THEN 1 END) as completed_features
FROM products p
LEFT JOIN features f ON p.id = f.product_id
GROUP BY p.id, p.name, p.slug, p.icon, p.color
ORDER BY p.name
```

### Get Tickets for User
```sql
SELECT t.*, p.name as product_name
FROM tickets t
LEFT JOIN products p ON t.product_id = p.id
WHERE t.assignee_id = $1 AND t.status = $2
ORDER BY t.created_at DESC
LIMIT 10
```

## 🔑 Key Differences: Supabase → PostgreSQL

| Feature | Supabase | PostgreSQL (lib/db) |
|---------|----------|---------------------|
| Client Init | `createClient()` | Imported `query()` |
| Single Record | `.single()` | `query(...)[0]` |
| Filtering | `.eq('col', val)` | `WHERE col = $1` |
| Joins | `.select('*, table(...)')` | `JOIN table ON ...` |
| Transactions | RLS Policies | Manual or lib/db wrapper |
| Error Handling | `{ data, error }` | Try/catch with query() |

## 💡 Helpful Tips

1. **Always parameterize queries:**
   ```typescript
   // ❌ BAD - SQL injection risk
   query(`SELECT * FROM users WHERE id = '${id}'`)
   
   // ✅ GOOD
   query('SELECT * FROM users WHERE id = $1', [id])
   ```

2. **Type safety:**
   ```typescript
   const result: Array<any> = resultFromQuery.rows;
   ```

3. **Check results exist:**
   ```typescript
   if (result.rows.length === 0) {
     notFound(); // or return null
   }
   ```

4. **For large lists, always limit:**
   ```typescript
   // Add LIMIT to prevent slow queries
   query('SELECT * FROM items ... LIMIT 100')
   ```

## 📞 Testing Commands

Once all pages are updated, test locally:

```bash
# Build
npm run build

# Run dev server
npm run dev

# In browser, test:
# 1. Sign up: http://localhost:3000/auth/signup
# 2. Login: http://localhost:3000/auth/login
# 3. Dashboard: http://localhost:3000/dashboard
# 4. Check DevTools → Application → Cookies for auth_token
```

## 🎯 Success Metrics

When complete:
- ✅ `npm run build` succeeds with no errors
- ✅ Signup/login flow works with real database
- ✅ Protected routes redirect unauthenticated users to /auth/login
- ✅ auth_token cookie persists across page reloads
- ✅ Logout clears session and redirects to login
- ✅ All data pages load from PostgreSQL (not Supabase)
- ✅ Admin panel shows all users with role management
- ✅ Ready for EC2 deployment

## 🚢 Next Steps

1. **Immediate:** Update the 8 remaining pages with database queries
2. **Validation:** Run `npm run build` until it completes successfully
3. **Testing:** Test the full signup→login→dashboard→logout flow locally
4. **Deployment:** Push to GitHub and deploy to EC2 using deploy_ec2.sh

The authentication backend is complete and ready. Just need to finish migrating the data queries!
