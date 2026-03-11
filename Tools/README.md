# Utilities

> **FOR AI AGENTS:** This directory contains tools for maintaining OpenPAI installations.

---

## Contents

### validate-protected.ts

**Security Validation**

Validates that PAI repository files don't contain sensitive data before committing. Used by the pre-commit hook automatically.

### BackupRestore.ts

**Backup and Restore**

Create and restore backups of PAI installations.

```bash
bun BackupRestore.ts backup                    # Create timestamped backup
bun BackupRestore.ts backup --name "pre-v3"    # Named backup
bun BackupRestore.ts list                      # List backups
bun BackupRestore.ts restore <backup-name>     # Restore
```

---

## Quick Reference

| File | Purpose |
|------|---------|
| validate-protected.ts | Validate no sensitive data in commits |
| BackupRestore.ts | Backup and restore PAI installations |

---

*Part of [OpenPAI](https://github.com/BishopCodes/OpenPAI) — a free, open-source fork of [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure).*
