-- ============================================================
-- Migration: Migrate from Supabase Auth to Custom JWT + PostgreSQL
-- ============================================================

-- Step 1: Update profiles table to add password_hash and remove Supabase auth dependency
-- This adds the custom authentication necessary for JWT-based auth

-- Add password_hash column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Update existing profiles to have a default password (bcrypt hash of 'Password123!')
-- In production, existing users will need to reset passwords
-- bcrypt hash: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm
UPDATE public.profiles 
SET password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm'
WHERE password_hash IS NULL;

-- Make password_hash NOT NULL after setting defaults
ALTER TABLE public.profiles ALTER COLUMN password_hash SET NOT NULL;

-- Step 2: Disable RLS policies since we're handling auth in the app layer
-- (Keep RLS enabled but policies are now app-level responsibility)
-- No changes needed here - existing policies are benign for custom auth

-- Step 3: Drop Supabase-specific triggers and functions (optional - they won't interfere)
-- We're keeping them for now in case profiles table still references auth.users
-- If you want a clean break, uncomment the lines below:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 4: Add indexes for performance (email lookup is common in auth)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================
-- Important: Database Connection Configuration
-- ============================================================
-- For custom auth to work, your application needs these environment variables:
-- 
-- DB_HOST=localhost (or your EC2 instance IP)
-- DB_PORT=5432
-- DB_NAME=tnai_pm
-- DB_USER=tnai_user
-- DB_PASSWORD=tneural123
-- JWT_SECRET=your-secret-key-change-in-production
--
-- These are used by lib/db.ts for PostgreSQL connection pooling
-- and lib/auth.ts for JWT token management
-- ============================================================
