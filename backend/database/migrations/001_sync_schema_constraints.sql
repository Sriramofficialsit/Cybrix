--
-- Brings databases created before commit a65f289 ("Fix database schema
-- constraints") in line with database/schema.sql.
--
-- schema.sql only runs on an empty Docker volume, so older local databases
-- never received those fixes. Safe to run more than once.
--
-- Run:
--   docker exec -i cybersecurity-postgres psql -U cyberuser -d cybersecurity_db \
--     -v ON_ERROR_STOP=1 < database/migrations/001_sync_schema_constraints.sql
--

BEGIN;

-- user_id may refer to users, organisation or professionals,
-- so these tables must not have a foreign key to a single table.
ALTER TABLE public.password_reset_tokens
    DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;

ALTER TABLE public.user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE public.professionals
    ADD COLUMN IF NOT EXISTS linkedin_profile TEXT;

ALTER TABLE public.organisation
    ALTER COLUMN current_status SET NOT NULL;

ALTER TABLE public.login_otps
    DROP CONSTRAINT IF EXISTS login_otps_account_type_check,
    ADD CONSTRAINT login_otps_account_type_check
        CHECK (account_type IN ('user', 'admin'));

ALTER TABLE public.professionals
    DROP CONSTRAINT IF EXISTS professionals_user_type_check,
    ADD CONSTRAINT professionals_user_type_check
        CHECK (user_type IN ('professional', 'recruiter'));

ALTER TABLE public.professionals
    DROP CONSTRAINT IF EXISTS professionals_designation_check,
    ADD CONSTRAINT professionals_designation_check
        CHECK (
            designation IN (
                'HR',
                'Technical',
                'Management',
                'Talent Acquisition'
            )
        );

COMMIT;
