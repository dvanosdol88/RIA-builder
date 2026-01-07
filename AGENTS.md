# AGENTS.md (Project-Level)
# Location: D:\anti-gravity-projects\construction-zone-CODEX\AGENTS.md
# This applies to this project and overrides global settings where specified.

---

## Security / Secrets Policy (Hard Rules)

### Never Commit Secrets
- **Never commit secrets of any kind** including API keys, tokens, private keys, service account JSON, passwords, or credentials.
- If a secret is ever committed (even briefly), it **must be rotated immediately** — consider it compromised.

### No Secrets in Frontend Code
- **Never expose secrets to frontend code.**
- **Explicitly prohibited:** Using `VITE_*` environment variables for secrets.
- **Explicitly prohibited:** Using `NEXT_PUBLIC_*` environment variables for secrets.
- These prefixes make variables available to client-side code and are visible in browser dev tools.

### Backend-Only Secrets Access
- **All sensitive API calls must go through backend endpoints** (Firebase Functions, server routes, etc.).
- **Secrets must live only in:**
  - Server-side environment variables
  - Secret managers (Google Secret Manager, AWS Secrets Manager, etc.)
  - Firebase Functions configuration (`firebase functions:config:set`)

### Pre-Commit Verification
- **Scan `git diff --cached` for secrets before every commit.**
- Look for patterns like API keys, tokens, passwords, private keys, and service account files.
- The pre-commit hook will block commits containing suspected secrets.

### Windows Reserved Filenames (Forbidden)
The following filenames are **forbidden** in this repository (Windows reserved names):
- `nul`, `con`, `prn`, `aux`
- `com1`, `com2`, `com3`, `com4`, `com5`, `com6`, `com7`, `com8`, `com9`
- `lpt1`, `lpt2`, `lpt3`, `lpt4`, `lpt5`, `lpt6`, `lpt7`, `lpt8`, `lpt9`

These names (with or without extensions) cause issues on Windows systems and must never be created.
