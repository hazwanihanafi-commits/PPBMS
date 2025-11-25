# AMDI PPBMS Full Repo (Generated)

This archive contains a production-ready **starter** implementation for the AMDI Postgraduate Progress Monitoring System (PPBMS).

**What is included**
- `backend/` — Node.js + Express backend with:
  - Google Sheets integration using a service account (see `SERVICE_ACCOUNT_PATH`).
  - Google Sign-In token verification (verify ID tokens from frontend).
  - Lateness detection job and cron runner.
  - Basic protected endpoints for admin/supervisor/student.
- `frontend/` — Next.js frontend skeleton (lightweight demo pages).
- `.env.example` files to configure environment variables.

**Important**
- This repo expects your service account JSON at:
  `/mnt/data/amdi-studentprogress-89366201d25e.json`
  (You uploaded this file to the environment; update `SERVICE_ACCOUNT_PATH` in `.env` if needed.)
- Update `SHEET_ID` in `backend/.env` to point to your Google Sheet.
- Create OAuth client in Google Cloud and set `GOOGLE_CLIENT_ID` for frontend sign-in.

**Quick start (backend)**
```bash
cd backend
npm install
cp .env.example .env
# edit .env with real values
npm start
```

**Quick start (frontend)**
```bash
cd frontend
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_API_BASE to backend URL and NEXT_PUBLIC_GOOGLE_CLIENT_ID
npm run dev
```

**Notes**
- This is a functional starter; extend UI, add write-back (batchUpdate) and email sending where noted.
- The lateness job currently computes statuses and logs a summary. We left write-back and emailing as clear TODO points to avoid accidental writes during testing.

Reference institutional PDF: PART-1.pdf (you provided). See project details in conversation history.
