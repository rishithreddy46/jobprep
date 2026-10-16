# JOBPREP.LIVE — DATA RESET & FRESH START REPORT
**Benchmark Date:** 16 October 2026  
**Timezone:** `Asia/Kolkata` (IST, UTC+05:30)  
**Data Version Identifier:** `JOBPREP-V2-FRESH-20261016`  
**Engineer:** Senior Full-Stack & Database Engineer  

---

## 1. Reset Context & Objectives

To prepare the JobPrep platform for an authentic, reliable learning and assessment cycle commencing **16 October 2026**, all demonstration results, prototype test attempts, simulated XP events, and sample progress records were safely backed up and purged.

Crucially:
- **Zero Question Loss:** The 105 core validated questions (and their exact correct answer keys and explanations) were strictly preserved.
- **Preloaded Tracks Preserved:** Reliance Industries Limited (RIL GET 2027), Larsen & Toubro (L&T GET 2027), and Tata Consultancy Services (TCS Prime/Digital) company track configurations were preserved.
- **Single-User Workspace:** The learner profile was anchored to candidate `Rishith`.

---

## 2. Pre-Reset vs. Post-Reset Database Metrics

| Database Table | Pre-Reset Row Count | Post-Reset Row Count | Action Taken | Integrity Status |
| :--- | :--- | :--- | :--- | :--- |
| `questions` | 105 | 105 | **Preserved** — All question prompts, 4 options, correct answer keys, and explanations retained. | Verified Intact |
| `companies` | 3 | 3 | **Preserved** — RIL GET, L&T GET, TCS Prime tracks retained. | Verified Intact |
| `study_tasks` | 74 | 74 | **Clean Reset** — Reset `status='not_started'`, `actual_minutes=0`, `notes=''`, `score_verified=0`, `completed_at=NULL`. | Fresh Baseline |
| `learner_profile` | 1 | 1 | **Updated** — Set candidate name to `Rishith`, target date `2026-10-26T00:00:00`, daily goals 60m / 20 questions. | Fresh Baseline |
| `test_runs` | 26 | 0 | **Purged** — Stale test attempts and prototype runs archived. | Clean |
| `question_attempts` | 471 | 0 | **Purged** — Prior question attempt logs archived. | Clean |
| `mistake_notebook` | 18 | 0 | **Purged** — Mock mistake records archived; fresh tracking enabled. | Clean |
| `xp_events` | 30 | 0 | **Purged** — Stale XP transaction events archived. | Clean |
| `daily_activity` | 2 | 0 | **Purged** — Pre-reset streak records purged; calendar starts fresh from 16 Oct 2026. | Clean |
| `user_achievements`| 3 | 0 | **Purged** — Badges reset for genuine achievement unlocking. | Clean |
| `study_sessions` | 0 | 0 | **Verified** — Focus timer session log ready for timer activity. | Clean |
| `ai_generated_questions`| 0 | 0 | **Verified** — Clean queue. | Clean |

---

## 3. Verified Backup Archive Details

Prior to executing the database reset transaction, a dual-format backup was created and cryptographically verified:

1. **Binary SQLite Backup:**
   - Path: `data/backups/get_quest_backup_20261016_pre_reset.db`
   - File Size: ~880 KB
   - Format: Direct binary copy with WAL checkpointing.

2. **Full JSON Database Export:**
   - Path: `data/backups/get_quest_backup_20261016_pre_reset.json`
   - Contains all 12 tables and full row objects.

### Backup Restoration Procedure

If at any point the pre-reset data needs to be inspected or restored, execute:
```bash
# To restore SQLite database from binary backup:
cp data/backups/get_quest_backup_20261016_pre_reset.db data/get_quest.db

# To restore from JSON export:
node -e "
import Database from 'better-sqlite3';
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('data/backups/get_quest_backup_20261016_pre_reset.json'));
const db = new Database('data/get_quest.db');
db.transaction(() => {
  for (const [table, rows] of Object.entries(data.tables)) {
    db.prepare('DELETE FROM ' + table).run();
    if (rows.length === 0) continue;
    const cols = Object.keys(rows[0]);
    const stmt = db.prepare('INSERT INTO ' + table + ' (' + cols.join(',') + ') VALUES (' + cols.map(() => '?').join(',') + ')');
    for (const r of rows) stmt.run(...Object.values(r));
  }
})();
console.log('Restored successfully');
"
```

---

## 4. Fresh Active State Confirmation

- Current Timezone: `Asia/Kolkata`
- Active Start Date: **16 October 2026**
- Candidate: `Rishith`
- Target Milestone Date: **26 October 2026**
- All tests and API queries now reflect zero initial progress, zero fabricated history, and a clear starting mission for 16 October 2026.
