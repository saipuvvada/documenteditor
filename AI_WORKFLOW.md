# AI Workflow & Engineering Decisions Log

This document details the collaboration between the engineer and AI tools (Antigravity coding agent and ChatGPT) during the time-boxed development of DocuCraft.

---

## 🛠️ AI Tools Utilized

- **Antigravity AI Agent**: Code generation, scaffolding, multi-file edits, package setup, refactoring, and integration testing execution.
- **ChatGPT**: Architecture design review and initial prompt breakdown.

---

## 📋 Major Tasks Log

### Task 1: Database Schema & Authorization Model
- **What AI Generated**: Initial Prisma schema draft and express routing skeleton.
- **What I Changed / Refined**: Added explicit compound unique constraint `@@unique([documentId, userId])` on `DocumentShare` to enforce database-level duplicate share prevention. Added `accessRole` in API payloads.
- **What I Verified**: Executed `npx prisma db push` and `npm run prisma:seed` to verify relational tables created cleanly.

### Task 2: Backend API & Authorization Middleware
- **What AI Generated**: Express middleware for checking `x-user-id` header and REST endpoints.
- **What I Changed / Refined**: Fixed TypeScript union typing issue in `getDocumentWithAccessCheck` helper function to return explicit `{ status: number, error: string }` error objects, preventing status code undefined runtime errors.
- **What I Verified**: Created 9 automated Vitest tests covering all authorization permutations (e.g. unauthorized user access attempt returning 403 Forbidden).

### Task 3: File Upload & Ingestion (.docx, .txt, .md)
- **What AI Generated**: Basic Multer configuration and Mammoth `.docx` conversion function.
- **What I Changed / Refined**: Built custom Markdown line-by-line parser (`parseMarkdownToHtml`) to properly convert Markdown headers (`#`, `##`), lists (`*`, `-`, `1.`), bold, and italic syntax into valid TipTap-compatible HTML DOM nodes. Added 5MB file size limit validation.
- **What I Verified**: Uploaded `.txt` files containing multiline text in tests and verified generated HTML paragraph structures. Tested unsupported file format rejection (.pdf -> 400 Bad Request).

### Task 4: TipTap Rich Text Editor & Autosave
- **What AI Generated**: Initial TipTap component hook boilerplate.
- **What I Changed / Refined**: Added debounced autosave effect (1000ms delay) with state indicator badge (`saving`, `saved`, `failed`, `unsaved`), title change synchronization, and manual Save button fallback. Fixed initial content load race condition by using `isInitialLoadRef` flag.
- **What I Verified**: Built production frontend bundle with `npm run build` and verified clean compilation of TipTap extension packages and Tailwind styles.

---

## 🚫 Examples of Modified or Rejected AI Output

1. **Rejected Unsanitized Document State**:
   - *AI Initial Suggestion*: Store raw plain text in database and parse markdown client-side on every render.
   - *Modification*: Replaced with server-parsed HTML persistence. HTML stored in SQLite matches TipTap's native DOM renderer directly, avoiding client-side parsing glitches and preserving document formatting reliably.

2. **Modified Authorization Middleware**:
   - *AI Initial Suggestion*: Frontend filtering only (hiding document cards in React).
   - *Modification*: Enforced strict server-side checking in `authMiddleware` and `getDocumentWithAccessCheck`. Returns 403 Forbidden immediately if request header `x-user-id` does not match owner ID or active share record.
