# PPBMS JSON Auth (Pilot)

## Features
- Email as identifier
- User-set password (hashed)
- JSON-based auth store
- Google Sheet for authorisation

## Setup
1. npm install express bcrypt jsonwebtoken
2. Set env:
   - JWT_SECRET
   - SHEET_ID
   - FRONTEND_URL
3. Run server

## Notes
- auth-users.json is ignored by git
- Passwords are never stored in plain text
