# MASTER BUILD PROMPT — RIL GET 2027 E&I QUEST PLATFORM

You are an expert product designer, full-stack TypeScript engineer, learning-science practitioner and test-data QA engineer. Build a working local-first web application called **GET Quest — RIL GET 2027 Preparation Lab** for a single candidate preparing for the Reliance Industries Limited Graduate Engineer Trainee (GET) 2027 online assessment, with a focus on Electronics & Instrumentation Engineering.

## FIRST: inspect the project files
If the user extracted the all-in-one ZIP, the data files are inside `RIL_GET_Quest_Data_Pack/`. If they have copied the files to the project root, use those root-level copies. Locate the files and read them before generating code; do not assume the archive has been extracted into a particular path. Read and use these files as the canonical initial data, not as inspiration to rewrite from scratch:
- `question_bank.json` — 70 original synthetic practice MCQs, answer keys and explanations.
- `sources.json` — source registry and confidence/reliability labels.
- `topic_blueprint.json` — priority taxonomy, knowledge gaps, topic resource links.
- `study_plan.json` — daily schedule for 16–26 Oct 2026 (Asia/Kolkata).
- `research_brief.md` — evidence summary, source limitations and provenance rules.

Do not change factual content or answers in the seeded question bank without explaining the proposed correction and updating the provenance/version. Do not make up official RIL test durations, question counts, marks, cutoffs or syllabus weights. The public current listing confirms only **Cognitive Test + Subject Matter**, branch-specific access and a private, quiet test environment. Display unknowns as unknowns.

## Product goal
A polished, gamified practice platform with the motivational feel of a coding-practice platform, but purpose-built for the RIL GET assessment. It should help the candidate do today's plan, launch topic-wise learning and tests, retain a streak, view daily and cumulative performance, identify weak topics, and export reports. The current use is local on the candidate's laptop; it must work without cloud deployment and without an API key.

## Tech stack and architecture
Choose a maintainable local development architecture and explain it in `README.md` before implementation. Preferred stack:
- React + TypeScript + Vite.
- Tailwind CSS and a polished component library if already configured; do not add heavy dependencies without need.
- Lightweight local backend in Node/Express or an equivalent secure local service.
- SQLite database for profile, attempts, answer events, learning sessions, streaks, notes, question review status, generated-question drafts and report snapshots.
- Use Prisma or a small reliable SQLite library; keep migrations and seed import reproducible.
- Charting library only if useful; charts must include labels and accessible descriptions.
- All app code and data remain in this workspace. Run locally via one documented command or two simple commands.

If the existing workspace already uses a working stack, inspect it and adapt rather than overwriting it blindly. Keep the application functional, not just a static mockup.

## UX / visual direction
Use a distinctive “industrial control-room meets RPG quest map” visual language: deep navy/graphite canvas, electric cyan and amber accents, subtle grid lines, instrument-dial progress rings, signal-wave motifs, sensor cards, mission badges, XP chips, streak flames and level progression. Avoid clutter or arcade noise; it must remain professional and highly readable when used for long study sessions. Use micro-interactions for completion and correct answers, but reduced-motion support and a calm mode must be provided. Use clear visual contrast and responsive design; make desktop/laptop the primary target and mobile usable.

Design should make the user feel that each completed session moves a visible “quest meter” forward. Use the progress, streak and XP system to reward consistency, not to shame missed days. Build encouraging, specific feedback (e.g., “Flow measurement mastery improved from 58% to 76%”) only when data actually supports it. Never invent praise metrics.

## Main screens
1. **Command Center / Dashboard**
   - Today’s mission card based on `study_plan.json`, with exact local times (Asia/Kolkata), estimated duration, topic chips and checkable steps.
   - “Continue today’s quest” CTA; one clear primary action.
   - Level, XP, current streak, longest streak, weekly consistency, overall completion percentage, total practice time, total questions attempted, overall accuracy.
   - Cognitive vs Instrumentation performance comparison.
   - “Weakest 3 topics” computed from data, with a minimum sample count label. If no data yet, show onboarding guidance rather than zeros masquerading as a meaningful skill score.
   - Daily report preview and cumulative report preview.
   - Upcoming assessment countdown based on the configured date; allow the candidate to edit date/time if official instructions change it.

2. **Quest Map / Study Roadmap**
   - Render all `study_plan.json` dates 16–26 Oct 2026 as a vertical campaign with day/mission cards.
   - Every day has named blocks, goals and measurable tasks. A task can be `not_started`, `in_progress`, `completed`, or `skipped`, with optional note and actual minutes.
   - Completion percentage = completed checklist items / total applicable checklist items; be explicit how skipped items are handled (exclude from denominator only if user consciously marks “not applicable”; plain missed tasks should not disappear).
   - Permit editing times/targets without overwriting the original seed plan. Save customizations locally.
   - Each day has “daily boss battle” quiz selected from that day’s topics, quick recap, and report result.

3. **Question Arena / Mock Tests**
   - Filter by track (Cognitive, Instrumentation, Mixed), topic, subtopic, difficulty, answered/wrong/bookmarked, and provenance.
   - Create topic test, timed sectional test, custom mixed test, wrong-answer retry and full simulation.
   - Default training mix may be 40% Cognitive / 60% Instrumentation but prominently label it **practice configuration only — not official RIL weightage** and allow editing.
   - Do not label a mock “official RIL paper”. Use “GET-style practice” or “original practice mock”.
   - Show one question at a time with accessible A/B/C/D choices, progress, timer, mark-for-review, previous/next, and submit confirmation. Persist every answer event locally so refresh/crash recovery is possible. Include a clear setting for whether navigation is enabled in practice mode.
   - Do not reveal answers/explanations until the question is submitted or the test ends, unless review mode is selected.
   - On results, show raw score, attempted, correct, incorrect, unanswered, accuracy (define denominator: correct/attempted), time per question, topic performance, difficulty split, and a list of questions to review. Never claim the score predicts selection or equals an RIL cutoff.
   - Use only the answer key embedded in the bank; add unit tests for scoring and answer mapping.

4. **Learning Library**
   - Topic cards grouped by priority P0/P1/P2 from `topic_blueprint.json`.
   - Show concise learning objectives and resources with source name, description, external link, checked date and content type.
   - External resources open in a new tab and are visually identified as external; never imply that a third-party practice site is RIL-affiliated.
   - Include YouTube search links from the resource map instead of inventing specific video IDs. Make clear users should select a relevant educator/video and verify the date/content.
   - Add a “learn 20 minutes → do 10 questions → review mistakes” loop on each topic.

5. **Reports & Analytics**
   - A report is available after each day’s activity, even when there is no test; state “insufficient test data” rather than fabricate precision.
   - **Daily report:** date, planned tasks, done/missed, actual study minutes, questions attempted, accuracy, time/question, strongest topic, weakest topic (only with enough questions), recurring error types, incorrect questions to retry, next-day recommendation.
   - **Cumulative report:** all days to date; cumulative active study minutes; total questions; accuracy trend; cognitive vs instrumentation accuracy; topic mastery trend; streak history; plan adherence; top recurring error types; recommended next 3 tasks.
   - Use both daily and cumulative views. On Day 1, show only one day plus a cumulative view that equals the single completed day. On Day 2 onward, show the day report and cumulative report separately.
   - Use small-sample warnings; e.g. “3 questions only — treat this topic score as preliminary.” Avoid deceptive chart scales.
   - Export a printable HTML report and/or CSV/JSON, and optionally create a PDF using a library only if stable. A browser print-to-PDF path is acceptable.
   - Include a date range filter and daily snapshot/history so past reports do not change unexpectedly when a test is edited; cumulative analytics can recompute from the event log.

6. **Profile, settings and local authentication**
   - For local single-user use, offer a profile name and optional local passcode/password gate. Hash passwords with a suitable password-hashing library on the backend; never store the raw password. Do not claim this is production-grade multi-user cloud authentication.
   - Provide “export all my data” and “reset all local data” with a confirmation step. Keep backups/export files under user control.
   - Persist app progress across browser restarts using SQLite backend, not only React state/localStorage. LocalStorage may be used for small UI preferences, not the only source of truth.
   - This is a study app, not associated with or endorsed by Reliance Industries. Include a discreet disclaimer.

## Streaks, XP and levels
Implement a transparent deterministic scoring system. Suggested initial design (make configurable):
- Complete a planned study block: 10 XP; complete daily mission: 25 bonus XP; complete a mock: 15 XP; review a wrong answer: 2 XP (cap review XP per day to discourage farming).
- No XP for opening the app or clicking random completion multiple times. Each task awards XP once; reverting/uncompleting should not award XP again.
- Streak counts a day when the candidate completes at least one substantive study action (e.g. ≥15 focused minutes OR completes 5 questions and reviews them). Let user configure their daily goal.
- Store calendar dates in Asia/Kolkata. No false streak if there is no qualifying activity; one missed day should be described kindly and not delete lifetime achievements.
- Levels are based on earned XP with clear thresholds and visual progress. Avoid manipulative variable rewards or shame copy.

## Data correctness, provenance and no fabricated exam intel
This is critical:
- Add visible provenance badges: `Current listing`, `Candidate report (anonymous)`, `Curriculum resource`, `Original practice question`, `AI-generated (pending review)`, `Approved practice question`.
- Candidate reports are anecdotes. Display year/date, role/discipline if known, and a caution that they may not reflect the 2027 GET assessment.
- Never show historical or generated questions as real leaked/recalled RIL questions.
- Keep exact official details separate from candidate reports and general study recommendations.
- Preserve each seeded MCQ’s ID, options, correct answer, explanation and provenance unless a tested data correction is needed.
- On import, validate: unique question IDs; exactly four distinct options; `correct_option_id` exists; nonempty explanation; valid track; valid difficulty; all topic references exist or are created; no duplicate normalized prompts.
- Build tests that verify all bank items satisfy the schema and score correctly when the correct option is selected and incorrectly when another option is selected.
- Add a content QA screen listing invalid questions, duplicate candidates, missing explanations and generated items pending approval.

## Optional internet/API updates — implement only as a safe optional enhancement
The application must fully work offline with the local seed bank. Do not web-scrape gated sites, copy question wording from third-party question banks, or depend on scraping Google search results. Public URLs in `sources.json` are for attribution and user navigation, not automatic wholesale content ingestion.

Design an optional **Question Lab** for AI-generated original practice items:
- Only enabled when the user adds their own API key to a local backend `.env` file; do not ask the user to paste keys into chat or store keys in frontend/browser storage.
- Keep `.env` in `.gitignore`; include `.env.example` with placeholder names only.
- Provider/model must be configurable and documented; if an OpenAI or Gemini provider is used, call it from the local backend only. Never hard-code a key or assume the key exists.
- Use `AI_PROVIDER`, `AI_MODEL` and provider-specific API key env variable as configured. If no key/network, the app continues normally.
- The model prompt must request original practice questions based on a topic blueprint and not request copyrighted verbatim questions or false past-paper claims.
- Return a strict JSON schema with question, four distinct options, correct option, concise solution, concept tested, estimated time, difficulty, source-topic pointers and `kind: ai_generated_pending_review`.
- Validate output locally; reject malformed output. For numerical answers, require calculation steps and run deterministic arithmetic checks where possible. For factual technical items, add a caution when the app cannot automatically verify facts.
- New AI questions stay in `pending_review`. The user must approve each item (or an explicitly selected batch) before it enters regular mocks. Keep a versioned record of model, prompt version, date generated and review state.
- Do not promise “new real RIL questions from the internet.” The safe promise is “new original practice questions on reviewed topics.”
- Include an optional “check sources” action that checks only whether curated resource URLs respond (with timeouts and respectful low frequency), then presents a diff/status to the user. Do not claim a page has new question content solely from a changed HTML hash.

## Daily / cumulative analytics definitions
Write these formulas in an in-app “How metrics are calculated” panel:
- `accuracy = correct / attempted`, where attempted excludes unanswered.
- `completion = completed applicable task items / total applicable task items`.
- `plan adherence = completed scheduled tasks / scheduled tasks due`, treating unstarted overdue tasks as incomplete.
- `topic accuracy = correct answers for topic / attempted answers for topic`; show sample size.
- `time per question = sum of answer durations / questions attempted`, excluding abandoned questions where duration is unavailable.
- `streak = consecutive local calendar days with at least one qualifying study action`.
- Show raw counts with all percentages. Do not use accuracy alone as a mastery score; combine with sample size, recency and repetition, and label heuristics clearly.

## Privacy and local safety
- Explain what is stored locally and how to export/delete it.
- Do not collect precise location, webcam, microphone, contacts or unnecessary personal data.
- No simulated webcam/proctoring or covert monitoring. Track only activity inside this preparation app.
- Do not claim to monitor the real Unstop test or the candidate’s behavior outside this app.
- Do not embed any private exam credentials or API secrets.

## Quality assurance and acceptance criteria
Before calling the project done, use Antigravity’s browser/testing capability (if available) to launch and exercise the actual app. At minimum:
1. Install dependencies and run the app locally; fix all compile/runtime errors.
2. Validate and import all 105 bank questions. Report exact count and invalid-item count.
3. Complete a sample quiz; prove score calculation, explanations and wrong-answer review work.
4. Reload the page and confirm attempts, streak and study task status persist.
5. Create Day 1 and Day 2 activity; verify day report and cumulative report are separate and correct.
6. Verify user can export report/data and reset local data with confirmation.
7. Verify no API secret appears in built frontend assets or Git-tracked files.
8. Check mobile responsive view, keyboard accessibility, focus state and reduced motion.
9. Check empty states, first day, missed day, no-data graphs and generated-question failures.
10. Provide a short final report containing files changed, how to run the app, how the seed data was validated, known limitations and exact next steps.

Do not stop at a UI mockup. Implement functional navigation, data persistence, question scoring, daily/cumulative reports, local authentication, streak/XP, source library and printable export. Work in safe increments: inspect → plan → implement data model → seed data → core quiz → progress/report logic → styling → browser QA → fix → handoff. Avoid destructive operations on unrelated workspace files.
