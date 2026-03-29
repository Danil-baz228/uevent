ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetToken" varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiresAt" timestamptz;
