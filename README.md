# DocuCraft — Lightweight Collaborative Document Editor

A lightweight, high-performance collaborative document editor inspired by Google Docs. Built for full-stack speed, clean authorization boundaries, rich text editing, and instant file ingestion (.docx, .txt, .md).

---

## 🌟 Features

- **Demo User System**: Instant toggle between test accounts (Sai, Priya, Alex) with persistent state.
- **TipTap Rich Text Editor**: Support for Bold, Italic, Underline, Heading 1, Heading 2, Bullet Lists, Numbered Lists, Undo, Redo.
- **Debounced Autosave**: Automatic background saving (800–1200ms debounce) with live visual status indicators (`Saving...`, `Saved`, `Save failed`).
- **File Ingestion**: Upload `.txt`, `.md`, or `.docx` files directly into rich text editor documents using Mammoth and HTML parsers.
- **Explicit Access Control**: Server-enforced authorization rules (Owners can read/edit/share/delete, Shared users can read/edit, Unrelated users receive HTTP 403 Forbidden).
- **Sharing Workflow**: Share documents with demo users with duplicate-share prevention and granular permissions.
- **Polished Dashboard**: Document organization split into "My Documents" and "Shared With Me" with search filtering and real-time metadata.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide React Icons
- **Rich Text Editor**: TipTap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`)
- **State Management**: React Context API (`DemoUserContext`) + LocalStorage persistence

### Backend
- **Runtime & Framework**: Node.js + Express + TypeScript
- **Documentation**: Swagger UI (`swagger-ui-express` + OpenAPI 3.0) at `/docs`
- **ORM & Database**: Prisma ORM + SQLite (`file:./dev.db`)
- **File Processing**: Multer (Upload handling), Mammoth (DOCX to HTML parsing)
- **Testing**: Vitest + Supertest

---

## 📚 Interactive API Documentation (Swagger UI)

Interactive Swagger UI documentation is available at:
👉 **[http://localhost:5001/docs](http://localhost:5001/docs)** (or [http://localhost:5001/api-docs](http://localhost:5001/api-docs))

Features:
- Complete OpenAPI 3.0 specification for all REST endpoints (`/api/users`, `/api/documents`, `/api/upload`).
- Authorize header button for testing with `x-user-id` (`user-sai`, `user-priya`, `user-alex`).
- Interactive file upload test interface for `.docx`, `.txt`, and `.md`.

---

## 🏗️ Project Architecture

```
/document-editor
  ├── /client                 # React + Vite + TipTap Frontend
  │     ├── src/
  │     │    ├── components/  # Dashboard, TipTapEditor, Header, Modals
  │     │    ├── context/     # DemoUserContext
  │     │    ├── services/    # API client
  │     │    └── types/       # TypeScript models
  ├── /server                 # Express + Prisma Backend
  │     ├── prisma/           # Schema & seed script
  │     ├── src/
  │     │    ├── middleware/  # Auth middleware (x-user-id header check)
  │     │    ├── routes/      # Express REST routes (users, documents, upload)
  │     │    ├── services/    # File parser service (Mammoth, MD, TXT)
  │     │    └── __tests__/   # Vitest authorization test suite
  ├── /docs                   # Additional architectural artifacts
  ├── README.md               # Overview & quick start guide
  ├── ARCHITECTURE.md         # Detailed system design & tradeoffs
  ├── AI_WORKFLOW.md          # AI-assisted development logs
  └── SUBMISSION.md           # Assessment submission details
```

---

## 🚀 Quick Setup & Installation

### Prerequisites
- Node.js (v18.x or later)
- npm (v9.x or later)

### 1. Repository Setup & Database Seeding

```bash
# Clone repository and navigate to server
cd document-editor/server

# Install backend dependencies
npm install

# Initialize SQLite database schema
npx prisma db push

# Seed demo users (Sai, Priya, Alex)
npm run prisma:seed
```

### 2. Running Backend Server

```bash
cd document-editor/server
npm run dev
# Server will run at http://localhost:5001
```

### 3. Running Frontend Client

```bash
cd document-editor/client

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
# Client will run at http://localhost:3000
```

---

## 🧪 Testing

The backend includes automated integration tests covering document creation, ownership authorization, access control, sharing, duplicate share prevention, and file upload validation.

```bash
cd document-editor/server
npm test
```

---

## 👥 Demo Users

The app uses a lightweight Demo Mode system instead of full auth:

| Name  | Email             | User ID      | Initial Documents |
| ----- | ----------------- | ------------ | ----------------- |
| Sai   | `sai@example.com` | `user-sai`   | Owner / Creator   |
| Priya | `priya@example.com`| `user-priya` | Share Recipient   |
| Alex  | `alex@example.com` | `user-alex`  | Unrelated User    |

Header `x-user-id` is attached to all API requests to simulate authentication.

---

## 📄 Supported File Types for Upload

- `.docx`: Converted using Mammoth HTML parser into formatted TipTap rich text.
- `.txt`: Parsed and formatted into HTML paragraph blocks (`<p>`).
- `.md`: Parsed from Markdown headers (`#`, `##`), bullet lists (`*`, `-`), numbered lists (`1.`), bold (`**`), italic (`*`) into clean HTML elements.

Max file size: **5 MB**. Unsupported file formats are rejected with HTTP 400 and clear error UI.

---

## ⚠️ Known Limitations

1. **No Real-time Websockets**: Collaboration works via REST API and debounced persistence. Simultaneous editing is handled via last-write-wins at the document field level.
2. **Demo Header Auth**: Authentication relies on client-submitted `x-user-id` headers for testing simplicity.
