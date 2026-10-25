# CODE-QUEST

CodeQuest is a static HTML platform for coding education — a student/teacher/recruiter ecosystem for DSA problems, courses, coding-round tests, batches, group chat, notifications, and job postings. No backend required: everything runs in the browser with `localStorage` as the data layer.

## 🧭 The Ecosystem

### 🔐 Accounts & Portals
| Page | What it does |
|---|---|
| `firstpage.html` | Main login / signup — routes you to the right portal by role |
| `loginforcomp.html` | Company / official registration (goes through admin approval) |
| `ONLALP.html` | Admin panel to approve official & recruiter accounts |
| `studentindex.html` | Student dashboard — tests, courses, DSA problems, chat, notifications |
| `teacherindex.html` | Teacher dashboard — rounds, courses, DSA problems, batches, chat |
| `recruiterindex.html` | Recruiter portal — post notifications, manage job postings & applications |

### 🛠 Creation Tools
| Page | What it does |
|---|---|
| `interview-maker.html` | Full coding-round / interview test builder (steps 1–5, publish with audience scoping) |
| `CQCmaker.html` | Course builder — modules, assignments, library |
| `createDSA.html` | DSA problem authoring — statement, examples, hidden test cases, code skeletons (Ace editor), send-to-chat |
| `CQmcqmaker.html` | MCQ question maker |
| `exceluploadcode.html` | Bulk question import from Excel |
| `createBatch.html` | Batch manager — add students by range (roll numbers auto-fill), bulk paste, shared password |
| `createpost.html` | Post a recruiter notification (with PDF / document attachments) |
| `createjob.html` | Build a job posting with a custom registration form, fees & QR, qualifications |

### 🎯 Attempt & Consume
| Page | What it does |
|---|---|
| `CodeQuestattempt.html` | The coding test / problem attempt experience (Ace editor, Consolas theme, console drawer) |
| `interound-attempt.html` | Interview-round attempt flow |
| `course-player.html` | Course viewer / player |
| `CodeQuestProgress.html` | Progress & submission analytics |
| `recPosts.html` | Notification timeline for students & teachers (ERP-style) |
| `openjobposting.html` | Browse jobs, apply via the dynamic form, review applications |
| `interview-makerforrecruiter.html` | Selection-test builder wrapper for recruiters (registered-candidates-only publish) |
| `createchat.html` | WhatsApp-style group chat — attachments, wallpapers, reminders, admin controls |

## 📦 Data Layer
Everything is stored in `localStorage` under `CodeQuest_*` and `TESTPAD_*` keys:

- `CodeQuest_active_session` — current logged-in user
- `CodeQuest_teacher_tests` / `CodeQuest_teacher_courses` — published content
- `CodeQuest_dsa_problems` — problem bank (incl. hidden test cases)
- `CodeQuest_batches` — batches & student credentials
- `CodeQuest_chat_groups` / `CodeQuest_chat_messages` — chat
- `CodeQuest_recruiter_posts` / `CodeQuest_job_postings` / `CodeQuest_job_applications` — recruiter flow

Content published with **audience scoping**: `universal` (everyone), `batch` (linked batch members only), or `registered` (job applicants only) — enforced on the student dashboard.

## 🚀 Run It
No build step. Just open `firstpage.html` in a browser, or serve the folder:

```
npx serve .
```

> ⚠️ This is a client-side demo platform — access control is visibility gating, not a security boundary. Real multi-user sync needs a backend.

## 🎨 Design System
- **Fonts:** Hind (body), Mulish (headings), JetBrains Mono / Consolas (code)
- **Teacher / recruiter accent:** `#D92D20`
- **Chat accent:** `#075E54`
- **Card style:** simple lesson-module cards with square orange progress bars
