# Assessment Submission — DocuCraft Collaborative Document Editor

## Project Information

- **Project Name**: DocuCraft — Collaborative Document Editor
- **Live URL**: [placeholder]
- **Repository / Source**: [placeholder]
- **Video Demonstration URL**: [placeholder]

---

## 👥 Seed Demo Users

The application implements a lightweight Demo Mode user switcher. The following accounts are available for testing access control:

1. **Sai**
   - **Email**: `sai@example.com`
   - **User ID**: `user-sai`
   - **Role**: Document Owner / Creator

2. **Priya**
   - **Email**: `priya@example.com`
   - **User ID**: `user-priya`
   - **Role**: Collaborative Share Recipient

3. **Alex**
   - **Email**: `alex@example.com`
   - **User ID**: `user-alex`
   - **Role**: Unrelated User (Used to test 403 Forbidden access denial)

---

## 🧪 Testing Instructions

### 1. Automated Vitest Integration Tests
Run the backend test suite to verify authorization enforcement, document creation, sharing, duplicate share prevention, and file upload validation:

```bash
cd document-editor/server
npm test
```

Expected output: **9 passed out of 9 tests**.

### 2. Manual Testing Instructions

#### A. Document Creation & Editing
1. Launch both servers (`cd server && npm run dev` and `cd client && npm run dev`).
2. Open `http://localhost:3000/`.
3. Verify top header shows **Sai** selected under Demo Mode.
4. Click **+ New Document**. The TipTap editor opens with "Untitled document".
5. Edit the document title to "Project Roadmap 2026".
6. Type bold text, headings, and bullet points in the editor.
7. Observe status badge changing to `Saving...` and then `Saved`.

#### B. Document Sharing & Access Control Verification
1. While editing "Project Roadmap 2026" as **Sai**, click the **Share** button in the header.
2. Click **Share** next to **Priya**. Verify status changes to "Access Granted".
3. Click the back arrow to return to the Dashboard. Verify "Project Roadmap 2026" is under **My Documents**.
4. Use the Demo User Switcher in the top right header to switch active user to **Priya**.
5. Observe that under Priya's dashboard, "Project Roadmap 2026" appears under **Shared With Me**.
6. Click to open the document as Priya. Make an edit to the content. Verify changes save successfully.
7. Switch demo user to **Alex**. Observe that Alex's dashboard has 0 documents under **My Documents** and 0 documents under **Shared With Me**.

#### C. File Upload Verification
1. As **Sai**, click **Upload File** on the Dashboard.
2. Select or drag a `.txt`, `.md`, or `.docx` file (up to 5 MB).
3. Click **Upload Document**. The server parses the file and opens the extracted content inside the TipTap editor.
4. Attempt uploading an unsupported file format (e.g. `.pdf` or `.jpg`). Verify clear error banner: *"Invalid file format. Only .txt, .md, and .docx files are supported."*

---

## 📄 Supported Upload Formats

- `.docx`: Converted using Mammoth HTML engine into formatted TipTap rich text.
- `.txt`: Parsed into HTML paragraph blocks (`<p>`).
- `.md`: Parsed from Markdown headings (`#`, `##`), bullet lists (`*`, `-`), numbered lists, bold (`**`), and italics (`*`) into clean HTML.

---

## ⚠️ Known Limitations

1. **Rest Authorization Header**: Demo authentication relies on the `x-user-id` header for simple instant testing without password inputs.
2. **REST Polling vs WebSockets**: Document updates persist via debounced REST `PUT` requests rather than WebSocket CRDT syncing.
