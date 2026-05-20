-- Add staff_team for admin duty separation (OPS/AD/CS)
-- NOTE: Keep existing users.role (ADMIN/SUPER_ADMIN) as global admin gate.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS staff_team text NOT NULL DEFAULT 'OPS';

CREATE INDEX IF NOT EXISTS idx_users_staff_team ON public.users(staff_team);

