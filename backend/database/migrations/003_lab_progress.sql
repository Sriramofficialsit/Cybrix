--
-- Hands-on lab progress (Learn > Labs). Safe to run more than once.
--
-- Run:
--   docker exec -i cybersecurity-postgres psql -U cyberuser -d cybersecurity_db \
--     -v ON_ERROR_STOP=1 < database/migrations/003_lab_progress.sql
--

BEGIN;

-- One row per learner per lab.
-- No foreign key intentionally: account_id may refer to an account in
-- users, organisation or professionals (account_type says which).
CREATE TABLE IF NOT EXISTS public.lab_progress (
    account_id UUID NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    lab_slug VARCHAR(60) NOT NULL,
    status VARCHAR(20) DEFAULT 'in_progress' NOT NULL,
    hints_revealed INTEGER DEFAULT 0 NOT NULL,
    hint_penalty INTEGER DEFAULT 0 NOT NULL,
    attempts INTEGER DEFAULT 0 NOT NULL,
    score INTEGER,
    -- Lab-specific state, e.g. {"ssh": true} once the simulated SSH login worked
    state JSONB DEFAULT '{}'::jsonb NOT NULL,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT lab_progress_pkey PRIMARY KEY (account_id, account_type, lab_slug),
    CONSTRAINT lab_progress_account_type_check
        CHECK (account_type IN ('learner', 'organisation', 'professionals')),
    CONSTRAINT lab_progress_status_check
        CHECK (status IN ('in_progress', 'completed'))
);

CREATE INDEX IF NOT EXISTS lab_progress_lab_slug_idx ON public.lab_progress (lab_slug, status);

COMMIT;
