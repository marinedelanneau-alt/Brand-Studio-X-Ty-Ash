-- Brand Studio X Ty Ash only: cplzwnlstcpqqzqeawgs.
-- Local preparation: select this project explicitly before manual execution.
-- Stores permissions only. Does not grant access or create/invite any account.
BEGIN;

ALTER TABLE public.client_access_codes
  ADD COLUMN IF NOT EXISTS can_view_clients boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS complimentary_access boolean NOT NULL DEFAULT false;

COMMIT;
