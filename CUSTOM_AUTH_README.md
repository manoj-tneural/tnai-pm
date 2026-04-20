# TNAI PM - Custom Authentication System

## Overview

This application has been migrated from **Supabase authentication** to a **custom JWT + PostgreSQL** authentication system. This allows for:

- ✅ Full self-hosting on EC2
- ✅ No external authentication dependencies
- ✅ Complete control over user data
- ✅ Cost optimization (eliminates Supabase costs)
- ✅ Email domain restriction (@tneuralai.com only)
- ✅ Role-based access control (5 roles)

## Architecture

### Components

1. **lib/db.ts** - PostgreSQL connection pooling
   - Uses `pg` library for Node.js
   - Configurable via environment variables
   - Pooled connections for performance

2. **lib/auth.ts** - Authentication utilities
   - `hashPassword()`: bcrypt password hashing (salt 10)
   - `verifyPassword()`: Timing-safe password comparison
   - `createToken()`: JWT token generation (7-day expiry)
   - `verifyToken()`: JWT token validation and decoding
   - `getTokenFromHeaders()`: Bearer token extraction from headers

3. **app/api/auth/\*** - Authentication API endpoints
   - `POST /api/auth/login` - User login with email/password
   - `POST /api/auth/signup` - User registration
   - `POST /api/auth/logout` - Session termination

4. **middleware.ts** - Route protection
   - Validates JWT tokens on protected routes
   - Redirects unauthenticated users to login
   - Clears expired tokens

5. **lib/hooks/useAuth.ts** - Client-side auth context
   - React Context for user state management
   - Global logout functionality
   - Loading and error state handling

## User Flows

### Login Flow

```
User enters email/password
      ↓
POST /api/auth/login
      ↓
Server queries profiles table (email lookup)
      ↓
Server verifies password with bcrypt.compare()
      ↓
SUCCESS: Generate JWT token
         Set httpOnly secure cookie (7 days)
         Return user data + token
         ↓ Redirect to /dashboard

FAILURE: Invalid credentials
         Return 401 error
```

### Signup Flow

```
User enters email/password/name/role
      ↓
Validate: @tneuralai.com domain check
         Password 8+ characters
         Email uniqueness (query DB)
      ↓
Hash password with bcrypt
      ↓
INSERT into profiles table
  (id, email, password_hash, full_name, role, created_at)
      ↓
SUCCESS: Generate JWT token
         Set httpOnly cookie
         Return user data + token
         ↓ Redirect to /dashboard

FAILURE: Validation error or duplicate email
         Return 400 or 409 error
```

### Protected Route Flow

```
User requests /dashboard (or other protected route)
      ↓
Middleware checks: Does auth_token cookie exist?
      ↓
NO → Redirect to /auth/login

YES → verifyToken(token) validates JWT
      ↓
      Valid JWT    → Continue to route
      ↓
      Invalid/Exp  → Delete cookie, redirect to login
```

## Environment Variables

Create `.env.local` in project root:

```bash
# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tnai_pm
DB_USER=tnai_user
DB_PASSWORD=tneural123

# JWT Secret (MUST CHANGE IN PRODUCTION)
JWT_SECRET=your-secret-key-change-in-production

# Environment
NODE_ENV=development
```

### Production Settings

For EC2 production deployment:

1. **Generate new JWT_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

2. **Update environment variables:**
   ```bash
   JWT_SECRET=<generated-secret-above>
   NODE_ENV=production
   DB_PASSWORD=<strong-postgres-password>
   ```

3. **Database configuration:**
   - Ensure PostgreSQL is running on EC2
   - Create `tnai_pm` database
   - Create `tnai_user` role with password
   - Run migrations: `002_custom_auth.sql`

## Database Schema

The `profiles` table structure:

```sql
CREATE TABLE profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name    TEXT,
  role         TEXT NOT NULL DEFAULT 'engineer'
               CHECK (role IN ('management','engineer','project_manager','sales','testing')),
  avatar_url   TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
```

### Migration Steps

The migration file `supabase/migrations/002_custom_auth.sql` will:

1. Add `password_hash` column to existing `profiles` table
2. Create index on email for fast lookups
3. Set default password for existing users (they'll be required to reset)

## API Endpoints

### POST /api/auth/login

**Request:**
```json
{
  "email": "user@tneuralai.com",
  "password": "password123"
}
```

**Success (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@tneuralai.com",
    "full_name": "User Name",
    "role": "engineer"
  },
  "token": "eyJhbGc..."
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid email/password or not @tneuralai.com
- `500`: Server error

### POST /api/auth/signup

**Request:**
```json
{
  "email": "newuser@tneuralai.com",
  "password": "password123",
  "full_name": "New User",
  "role": "engineer"
}
```

**Success (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@tneuralai.com",
    "full_name": "New User",
    "role": "engineer"
  },
  "token": "eyJhbGc..."
}
```

**Errors:**
- `400`: Validation failed (password < 8 chars, missing domain, etc.)
- `409`: Email already exists
- `500`: Server error

### POST /api/auth/logout

**Request:** (no body, uses auth_token cookie)

**Success (200):**
```json
{
  "message": "Logged out"
}
```

**Cookie Behavior:**

All endpoints that succeed set an `auth_token` cookie:
```
auth_token=<JWT>; HttpOnly; Secure; SameSite=Lax; MaxAge=604800 (7 days)
```

- **HttpOnly**: Prevents JavaScript access (XSS protection)
- **Secure**: Only sent over HTTPS in production
- **SameSite=Lax**: CSRF protection
- **MaxAge**: 7 days = 604800 seconds

## Security Considerations

### Password Hashing
- Uses bcrypt with salt factor 10
- Timing-safe comparison via `bcrypt.compare()`
- Passwords never stored in plaintext
- Hash computation takes ~100ms (prevents brute force)

### JWT Tokens
- Signed with HS256 algorithm
- Includes `userId`, `email`, `role` as claims
- 7-day expiration for reasonable security/usability balance
- Stored in httpOnly cookies (not localStorage)

### Email Validation
- Restricted to `@tneuralai.com` domain
- Validated on signup and login
- Prevents external user registration

### Route Protection
- Middleware validates tokens before route access
- Automatic redirect to /auth/login for unauthorized users
- Expired tokens deleted and sessions cleared

## Package Dependencies

New packages added:

- **bcrypt** v5.1.0 - Password hashing
  - Native Node.js bindings
  - Industry-standard password security

- **jsonwebtoken** v9.1.0 - JWT token handling
  - Token signing and verification
  - Standard JWT library for Node.js

- **pg** v8.11.0 - PostgreSQL client
  - Connection pooling
  - Parameterized query support

## Development

### Local Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure PostgreSQL is running:
   ```bash
   # macOS with Homebrew
   brew services start postgresql
   
   # EC2 / Ubuntu
   sudo systemctl start postgresql
   ```

3. Create database and user:
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE tnai_pm;"
   sudo -u postgres psql -c "CREATE USER tnai_user WITH PASSWORD 'tneural123';"
   sudo -u postgres psql -d tnai_pm -c "GRANT ALL PRIVILEGES ON SCHEMA public TO tnai_user;"
   ```

4. Run migrations:
   ```bash
   # Run both migration files in order
   psql -U tnai_user -d tnai_pm -f supabase/migrations/001_init.sql
   psql -U tnai_user -d tnai_pm -f supabase/migrations/002_custom_auth.sql
   ```

5. Set environment variables:
   ```bash
   # .env.local
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=tnai_pm
   DB_USER=tnai_user
   DB_PASSWORD=tneural123
   JWT_SECRET=dev-secret-key
   NODE_ENV=development
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

7. Visit http://localhost:3000

### Testing Authentication

**Signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@tneuralai.com",
    "password": "TestPassword123",
    "full_name": "Test User",
    "role": "engineer"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@tneuralai.com",
    "password": "TestPassword123"
  }' \
  -i  # Shows headers including Set-Cookie
```

**Logout (requires cookie):**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b "auth_token=<token-from-login>" \
  -i
```

## EC2 Deployment

See [EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md) for full deployment instructions.

### Quick Summary

1. Install Node.js, PostgreSQL, Nginx, PM2
2. Clone repository
3. Run `npm install && npm run build`
4. Set environment variables in `/home/ubuntu/tnai-pm/.env`
5. Start with PM2: `pm2 start npm --name "tnai-pm" -- start`
6. Configure Nginx reverse proxy
7. Set up SSL with Let's Encrypt

## Troubleshooting

### "Invalid email or password" on login
- Check that user exists in database: `SELECT * FROM profiles WHERE email='...';`
- Verify password_hash column is populated
- Ensure @tneuralai.com domain validation isn't being blocked

### "JWT malformed" errors
- Check JWT_SECRET environment variable is set correctly
- Verify it matches between login/api endpoint and middleware
- Check token expiration (7-day default)

### PostgreSQL connection errors
- Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in .env
- Test connection: `psql -h localhost -U tnai_user -d tnai_pm`
- Check PostgreSQL is running: `psql --version`

### Middleware not protecting routes
- Verify `middleware.ts` is at project root
- Check that routes are in the matcher pattern
- Ensure auth_token cookie is being set on login

### Token not persisting
- Check browser cookies: DevTools → Application → Cookies
- Verify `auth_token` cookie has HttpOnly flag
- Check cookie MaxAge is set to 604800 seconds

## Migration from Supabase

This system replaces Supabase entirely. If you had existing Supabase users:

1. Export user passwords from Supabase (if available)
2. Hash them with bcrypt using `lib/auth.ts` functions
3. Populate `password_hash` column in profiles table
4. Delete Supabase client libraries from package.json
5. Update all data queries to use `lib/db.ts` instead

## Files Changed/Added

### New Files
- `lib/db.ts` - PostgreSQL connection
- `lib/auth.ts` - Auth utilities
- `lib/hooks/useAuth.ts` - Auth context hook
- `app/api/auth/login/route.ts` - Login endpoint
- `app/api/auth/signup/route.ts` - Signup endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint
- `middleware.ts` - Route protection
- `supabase/migrations/002_custom_auth.sql` - Database migration
- `CUSTOM_AUTH_README.md` - This file

### Modified Files
- `app/auth/login/page.tsx` - Uses new API endpoint
- `app/auth/signup/page.tsx` - Uses new API endpoint
- `package.json` - Removed @supabase, added bcrypt/jwt/pg
- `.env.example` - Updated for custom auth

### Removed Dependencies
- `@supabase/supabase-js`
- `@supabase/ssr`

## Support & Questions

For issues or questions about the authentication system:
1. Check logs: `npm run dev` shows all auth errors
2. Review middleware.ts for route protection logic
3. Check lib/auth.ts for token validation details
4. Verify database exports with psql commands

## License

Same as main project
