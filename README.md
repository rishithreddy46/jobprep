# RIL GET Quest — Data Pack

Prepared on 15 October 2026.

## Files
- `ANTIGRAVITY_BUILD_PROMPT.md` — the master implementation prompt for Google Antigravity.
- `question_bank.json` — 105 original synthetic MCQs with answer keys and explanations (35 cognitive, 70 instrumentation).
- `question_bank.csv` — spreadsheet-friendly version of the same bank.
- `question_bank.schema.json` — schema reference.
- `sources.json` — source URLs, checked dates, reliability notes and how each source should be used.
- `research_brief.md` — the evidence synthesis and caveats.
- `topic_blueprint.json` — priorities and educational resource links.
- `study_plan.json` — detailed local-time plan for 16–26 October, starting on 16 Oct evening after the user's NPTEL exam.
- `validation_report.json` — automated data-integrity check results.

## Accuracy boundary
The current listing confirms the categories Cognitive Test + Subject Matter but not a detailed syllabus or scoring format. Candidate reports are anonymous anecdotes. The bank contains original practice items—not an official paper and not copied verbatim from question sites.

## Recommended development approach
Build the MVP to work completely offline with the fixed bank. Add AI-assisted question generation only as an optional backend feature that produces unique practice questions and queues them for review. An API cannot reliably reveal the future official test questions. Never expose API keys in frontend code.
