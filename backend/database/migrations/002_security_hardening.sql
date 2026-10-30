--
-- Security hardening (see vul.txt). Safe to run more than once.
--
-- Run:
--   docker exec -i cybersecurity-postgres psql -U cyberuser -d cybersecurity_db \
--     -v ON_ERROR_STOP=1 < database/migrations/002_security_hardening.sql
--
-- Side effects (all short-lived data):
--   * pending logins, verification / reset links and pending email changes
--     are cleared, because tokens are now stored hashed. Users just log in
--     again or request a new link.
--

BEGIN;

-- professionals never had the email change columns the other account
-- tables have, so email change (and profile save) failed for them
ALTER TABLE public.professionals
    ADD COLUMN IF NOT EXISTS pending_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email_change_token TEXT,
    ADD COLUMN IF NOT EXISTS email_change_expires_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS email_change_report_token TEXT;

-- --------------------------------------------------
-- M6: tokens and OTPs are now stored as SHA-256 hashes.
-- Existing plaintext ones are removed.
-- --------------------------------------------------

DELETE FROM public.login_otps;
DELETE FROM public.email_verification_tokens;
DELETE FROM public.password_reset_tokens;
DELETE FROM public.admin_email_verification_tokens;

UPDATE public.users
SET pending_email = NULL, email_change_token = NULL,
    email_change_report_token = NULL, email_change_expires_at = NULL;

UPDATE public.organisation
SET pending_email = NULL, email_change_token = NULL,
    email_change_report_token = NULL, email_change_expires_at = NULL;

UPDATE public.professionals
SET pending_email = NULL, email_change_token = NULL,
    email_change_report_token = NULL, email_change_expires_at = NULL;

-- --------------------------------------------------
-- M9: TIMESTAMP -> TIMESTAMPTZ everywhere.
-- Remaining values were written by DB defaults (UTC).
-- --------------------------------------------------

DO $$
DECLARE
    col record;
BEGIN
    FOR col IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type = 'timestamp without time zone'
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ALTER COLUMN %I TYPE TIMESTAMPTZ USING %I AT TIME ZONE ''UTC''',
            col.table_name, col.column_name, col.column_name
        );
    END LOOP;
END $$;

-- --------------------------------------------------
-- C1 / C2: login challenge bound to the password step,
-- with an attempt limit and resend limits
-- --------------------------------------------------

ALTER TABLE public.login_otps
    ALTER COLUMN otp TYPE TEXT,
    ADD COLUMN IF NOT EXISTS login_token_hash TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS resend_count INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS login_otps_login_token_hash_key
    ON public.login_otps (login_token_hash);

-- --------------------------------------------------
-- H4: token_version, bumped on logout / password change / reset,
-- revokes every JWT issued before
-- --------------------------------------------------

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.organisation
    ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.professionals
    ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.admins
    ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0 NOT NULL;

-- --------------------------------------------------
-- P1: missing indexes
-- --------------------------------------------------

CREATE INDEX IF NOT EXISTS login_otps_account_idx
    ON public.login_otps (account_id, account_type);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx
    ON public.email_verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
    ON public.password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS admin_email_verification_tokens_admin_id_idx
    ON public.admin_email_verification_tokens (admin_id);

CREATE INDEX IF NOT EXISTS users_email_change_token_idx
    ON public.users (email_change_token) WHERE email_change_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_email_change_report_token_idx
    ON public.users (email_change_report_token) WHERE email_change_report_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS organisation_email_change_token_idx
    ON public.organisation (email_change_token) WHERE email_change_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS organisation_email_change_report_token_idx
    ON public.organisation (email_change_report_token) WHERE email_change_report_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS professionals_email_change_token_idx
    ON public.professionals (email_change_token) WHERE email_change_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS professionals_email_change_report_token_idx
    ON public.professionals (email_change_report_token) WHERE email_change_report_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_pending_email_idx
    ON public.users (pending_email) WHERE pending_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS organisation_pending_email_idx
    ON public.organisation (pending_email) WHERE pending_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS professionals_pending_email_idx
    ON public.professionals (pending_email) WHERE pending_email IS NOT NULL;

-- --------------------------------------------------
-- L2: usernames unique regardless of case ("Admin" vs "admin").
-- Fails if such duplicates already exist; rename them first.
-- Also makes LOWER(username) lookups at login use an index.
-- --------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key
    ON public.users (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS organisation_username_lower_key
    ON public.organisation (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS professionals_username_lower_key
    ON public.professionals (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS admins_username_lower_key
    ON public.admins (LOWER(username));

COMMIT;
