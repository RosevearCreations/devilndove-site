-- Devil n Dove administrator seed template
-- Release 467 Build 31 security boundary:
--   Do NOT commit or reuse a plaintext password or reusable password hash here.
--   Create the first administrator through /api/auth/bootstrap-admin while bootstrap is allowed,
--   or create/reset an administrator through the authenticated Admin Users screen.
--   Those runtime authorities generate a unique salted PBKDF2 password hash.
--
-- This file intentionally contains no executable credential INSERT and no reusable credential hash.
SELECT 'Use the authenticated bootstrap/admin account flow to create credentials; static password hashes are intentionally disabled.' AS credential_seed_instruction;
