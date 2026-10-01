# Architecture Specification & Technical Decisions

## 1. System Overview & Data Flow

The Collaborative Document Editor follows a decoupled Client-Server architecture with explicit authorization gates:

```
+-------------------------------------------------------------+
|                      React Frontend                         |
|  - TipTap Editor (Rich Text Canvas)                         |
|  - DemoUserContext (Header `x-user-id` state)               |
|  - Debounced Autosave (1000ms delay)                        |
+------------------------------+------------------------------+
                               | HTTP REST (JSON / Multipart)
                               v
+-------------------------------------------------------------+
|                      Express Backend                        |
|  - `authMiddleware` (Validate `x-user-id` header)            |
|  - Authorization Gate (`getDocumentWithAccessCheck`)         |
|  - File Parser Service (Mammoth DOCX, TXT, MD)              |
+------------------------------+------------------------------+
                               | Prisma Client (ORM)
                               v
+-------------------------------------------------------------+
|                      SQLite Database                        |
|  - User Entity (`id`, `name`, `email`)                       |
|  - Document Entity (`id`, `title`, `content`, `ownerId`)     |
|  - DocumentShare Entity (`id`, `documentId`, `userId`)       |
+-------------------------------------------------------------+
```

---

## 2. Domain & Authorization Model

### Data Entities
- **User**: Represents a demo account. Identified by unique ID (`user-sai`, `user-priya`, `user-alex`).
- **Document**: Main document record storing HTML rich-text string in `content`, document `title`, and reference to `ownerId`.
- **DocumentShare**: Junction record representing permission granted to a non-owner `userId` for a given `documentId`. Contains a compound unique index `@@unique([documentId, userId])` to prevent duplicate shares.

### Explicit Authorization Rules
Authorization is calculated server-side inside `src/routes/documents.ts` on every incoming API request:

1. **Owner (`ownerId === req.userId`)**:
   - Read (`GET /api/documents/:id`) -> ALLOW
   - Edit (`PUT /api/documents/:id`) -> ALLOW
   - Share (`POST /api/documents/:id/share`) -> ALLOW
   - Delete (`DELETE /api/documents/:id`) -> ALLOW

2. **Shared User (`DocumentShare.exists(documentId, req.userId)`)**:
   - Read (`GET /api/documents/:id`) -> ALLOW
   - Edit (`PUT /api/documents/:id`) -> ALLOW
   - Share / Delete -> DENIED (HTTP 403 Forbidden)

3. **Unrelated User**:
   - All operations -> DENIED (HTTP 403 Forbidden)

---

## 3. Ingestion & File Parsing Strategy

When a user uploads a document (.txt, .md, .docx):
1. **Multer Middleware**: Intercepts upload in-memory buffer (5 MB ceiling). Validates file extension against allowed whitelist (`.txt`, `.md`, `.docx`).
2. **Parsing Service (`fileParser.ts`)**:
   - `.docx`: Converted using Mammoth HTML engine into semantic HTML tags (`<p>`, `<h1>`, `<ul>`, etc.).
   - `.txt`: Standardizes line breaks and wraps paragraphs into HTML `<p>` tags.
   - `.md`: Parses Markdown headings (`#`, `##`), bullet lists (`*`, `-`), numbered lists, bold (`**`), and italics (`*`) into clean HTML.
3. **Persist & Return**: Saves parsed HTML as a new document owned by the current demo user and returns it immediately to client to open in TipTap.

---

## 4. Persistence & Autosave Strategy

- **HTML Consistency**: TipTap content is stored as sanitized HTML strings in SQLite. This ensures formatting (bold, italic, underline, lists, headings) is preserved across page refreshes and different browsers.
- **Debounced Autosave**: Client listens to TipTap `onUpdate` events and title input changes. Fires an HTTP `PUT` request 1000ms after typing stops.
- **Save State Machine**: State transitions between `unsaved` -> `saving` -> `saved` (or `failed` if network/authorization error occurs).

---

## 5. Major Architectural Tradeoffs

1. **REST vs WebSockets**:
   - *Tradeoff*: Used REST polling/fetches instead of WebSockets.
   - *Rationale*: Time-boxed assessment prioritizing complete working end-to-end functionality, authorization robustness, file parsing, and clean testing over real-time CRDT/OT complexity.

2. **Header-based Auth (`x-user-id`)**:
   - *Tradeoff*: Header-based demo user identification instead of JWT/Session cookies.
   - *Rationale*: Ideal for quick manual testing of permissions without login friction, while retaining strict server-side authorization enforcement.
