# Student Supervisor System — Backend API

Full Node.js + Express + MongoDB (Mongoose) backend implementing the plan in
`Student Supervisor System Plan (MERN + Cloudinary)`: Admin / Supervisor /
Student roles, milestone guidelines, versioned submissions, review workflow,
Cloudinary direct uploads, an audit log, and automated email notifications
sent through the **Gmail API using OAuth2**.

---

## 1. Stack

| Layer      | Technology                                             |
|------------|---------------------------------------------------------|
| Runtime    | Node.js (ESM), Express 5                                 |
| Database   | MongoDB via Mongoose                                     |
| Auth       | JWT access token (header) + JWT refresh token (httpOnly cookie) |
| File store | Cloudinary (signed direct-to-client uploads)             |
| Email      | Gmail API via OAuth2 (googleapis + nodemailer)            |
| Security   | helmet, cors, express-rate-limit, bcrypt password hashing |

---

## 2. Project structure

```
server/
├── server.js                  # entry point (loads env, connects DB, starts app)
├── src/
│   ├── app.js                 # Express app: middleware + route mounting
│   ├── config/
│   │   ├── db.js              # Mongoose connection
│   │   ├── cloudinary.js      # Cloudinary SDK config
│   │   └── googleEmail.js     # Gmail OAuth2 transporter
│   ├── models/                # User, Group, Milestone, Submission, Notification, AuditLog, Settings
│   ├── middleware/             # auth (JWT + RBAC), validate, errorHandler
│   ├── controllers/            # business logic per resource
│   ├── routes/                 # Express routers, one per resource + index.js
│   ├── services/                # email, notification, cloudinary signing, audit log
│   ├── templates/               # HTML email templates
│   └── scripts/seedAdmin.js    # bootstraps the first Admin account
├── package.json
└── .env.example
```

---

## 3. Setup

```bash
cd server
npm install
cp .env.example .env      # then fill in the real values (see sections below)
npm run seed:admin        # creates the first Admin account
npm run dev                # starts on http://localhost:5000
```

### 3.1 MongoDB
Set `MONGO_URI` in `.env` to your MongoDB Atlas (or local) connection string.

### 3.2 Cloudinary
From your Cloudinary dashboard, copy `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
and `CLOUDINARY_API_SECRET` into `.env`. The frontend calls
`POST /api/uploads/signature` to get a signed payload, then uploads directly to
`https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload` (Section 7 of the plan).

### 3.3 JWT secrets
Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to two long random strings
(e.g. `openssl rand -hex 32`).

---

## 4. Gmail OAuth2 Setup (required for email notifications)

Since you already created a project and OAuth credentials in Google Cloud
Console, you mainly need one more thing: a **refresh token** tied to the Gmail
account you want to send from. Here's the full path, including what you've
likely already done:

### Step 1 — Enable the Gmail API
In [Google Cloud Console](https://console.cloud.google.com/), open your
project → **APIs & Services → Library** → search "Gmail API" → **Enable**.

### Step 2 — OAuth consent screen
**APIs & Services → OAuth consent screen**. Choose **External** (or
**Internal** if using Google Workspace), fill in the required fields, and add
your own Gmail address under **Test users** (required while the app is in
"Testing" publish status).

### Step 3 — OAuth 2.0 Client ID credentials
**APIs & Services → Credentials → Create Credentials → OAuth client ID**.
- Application type: **Web application**
- Authorized redirect URIs: add `https://developers.google.com/oauthplayground`
  (this lets you generate a refresh token quickly without building your own
  consent flow)

Copy the generated **Client ID** and **Client Secret** into `.env` as
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### Step 4 — Generate a refresh token (one-time, via OAuth Playground)
1. Go to https://developers.google.com/oauthplayground
2. Click the gear icon (top right) → check **"Use your own OAuth credentials"**
   → paste in your Client ID and Client Secret → close.
3. In the left panel, find **Gmail API v1** → select the scope
   `https://www.googleapis.com/auth/gmail.send`.
4. Click **Authorize APIs** → sign in with the Gmail account you want the
   system to send from → allow access.
5. Click **Exchange authorization code for tokens**.
6. Copy the **Refresh token** shown — this is your `GOOGLE_REFRESH_TOKEN`.

### Step 5 — Fill in `.env`
```
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_REFRESH_TOKEN=the_refresh_token_from_step_4
GOOGLE_GMAIL_SENDER=the_gmail_address_you_authorized_in_step_4
```

The refresh token does not expire under normal use (unless revoked, unused
for 6 months, or the OAuth consent screen is still in "Testing" mode with a
7‑day token expiry — if that happens, publish the OAuth consent screen or
repeat Step 4). Access tokens are refreshed automatically on every email send
(`src/config/googleEmail.js`), so no further manual steps are needed after
this.

### How it's wired into the code
- `src/config/googleEmail.js` — builds a `nodemailer` transporter authenticated
  via OAuth2 against the Gmail API.
- `src/services/email.service.js` — thin wrapper that sends a single email.
- `src/services/notification.service.js` — called by controllers; creates an
  in-app `Notification` document **and** sends the email, recording success/
  failure on the notification so a bad email never blocks the underlying
  action (e.g. approving a submission still succeeds even if Gmail is down).
- `src/templates/emailTemplates.js` — HTML templates for each of FR-N1–FR-N5.

---

## 5. Authentication flow

- `POST /api/auth/login` — returns `{ user, accessToken }`; refresh token is
  set as an httpOnly cookie scoped to `/api/auth`.
- `POST /api/auth/refresh` — reads the refresh cookie, returns a new
  `accessToken` (and rotates the refresh cookie).
- `POST /api/auth/logout` — clears the refresh cookie.
- `POST /api/auth/change-password` — required after first login for accounts
  created by an Admin (`mustChangePassword: true`); invalidates the previous
  refresh token.
- Every protected route expects `Authorization: Bearer <accessToken>`.

Roles: `admin`, `supervisor`, `student`. Enforced via `authorize(...roles)`
middleware on every route (FR-C1).

---

## 6. API Reference

All endpoints are prefixed with `/api`. 🔒 = requires `Authorization` header.

### Auth
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /auth/login | Public | FR-C1 |
| POST | /auth/refresh | Public (cookie) | |
| POST | /auth/logout | Public | |
| GET  | /auth/me | 🔒 Any | |
| POST | /auth/change-password | 🔒 Any | |

### Users (Admin)
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /users | 🔒 Admin | FR-A1 — creates account, emails temp password |
| GET  | /users | 🔒 Admin | filter by role/groupId/supervisorId/search |
| GET  | /users/:id | 🔒 Admin | |
| PATCH | /users/:id | 🔒 Admin | FR-A1, FR-A4 (reassign supervisor triggers FR-N1) |
| DELETE | /users/:id | 🔒 Admin | FR-A1 |
| POST | /users/:id/assign-supervisor | 🔒 Admin | FR-A3 |
| PATCH | /me | 🔒 Any | FR-C4 |

### Groups (Admin)
| Method | Path | Access |
|---|---|---|
| POST | /groups | 🔒 Admin (FR-A2) |
| GET  | /groups | 🔒 Admin, Supervisor |
| GET  | /groups/:id | 🔒 Admin, Supervisor |
| PATCH | /groups/:id | 🔒 Admin |
| DELETE | /groups/:id | 🔒 Admin |

### Milestones (Supervisor)
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /milestones | 🔒 Supervisor | FR-S2 → FR-N2/FR-N3 emails |
| GET  | /milestones | 🔒 Any | scoped by role |
| GET  | /milestones/:id | 🔒 Any | |
| PATCH | /milestones/:id | 🔒 Supervisor/Admin | |
| DELETE | /milestones/:id | 🔒 Supervisor/Admin | |
| GET  | /milestones/:id/submissions | 🔒 Supervisor/Admin | FR-S3 |

### Submissions
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /submissions | 🔒 Student | FR-T3/FR-T4 → FR-N4 email to supervisor |
| GET  | /submissions/:id | 🔒 Any (scoped) | FR-S4 |
| PATCH | /submissions/:id/approve | 🔒 Supervisor | FR-S5 → FR-N5 |
| PATCH | /submissions/:id/request-changes | 🔒 Supervisor | FR-S6 (comment required) → FR-N5 |
| POST | /submissions/:id/comments | 🔒 Supervisor/Student | FR-S7/FR-T6 |

### Relationships & dashboards
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | /supervisors/:id/students | 🔒 Admin/Supervisor | FR-S1 |
| GET | /students/:id/supervisor | 🔒 Any (scoped) | FR-T1 |
| GET | /students/:id/milestones | 🔒 Any (scoped) | FR-T2 |
| GET | /students/:id/progress | 🔒 Any (scoped) | FR-S8/FR-T7 |
| GET | /admin/dashboard | 🔒 Admin | FR-A5/FR-A6 |

### Uploads, notifications, settings, audit
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /uploads/signature | 🔒 Any | FR-C2, Section 7 |
| GET  | /notifications | 🔒 Any | FR-T10 |
| PATCH | /notifications/:id/read | 🔒 Any | |
| PATCH | /notifications/read-all | 🔒 Any | |
| GET  | /settings | 🔒 Any | |
| PATCH | /settings | 🔒 Admin | FR-A7 |
| GET  | /audit-logs | 🔒 Admin | FR-C3, supports `?search=` |

---

## 7. Client-side Cloudinary upload flow (Section 7)

```js
// 1. Ask backend for a signature
const { data } = await api.post('/uploads/signature', { folder: 'submissions' });

// 2. Upload directly to Cloudinary
const form = new FormData();
form.append('file', file);
form.append('api_key', data.apiKey);
form.append('timestamp', data.timestamp);
form.append('signature', data.signature);
form.append('folder', data.folder);

const res = await fetch(
  `https://api.cloudinary.com/v1_1/${data.cloudName}/auto/upload`,
  { method: 'POST', body: form }
);
const asset = await res.json(); // { public_id, secure_url, format, bytes, ... }

// 3. Submit the asset reference to the backend
await api.post('/submissions', {
  milestoneId,
  files: [{
    originalFilename: file.name,
    publicId: asset.public_id,
    secureUrl: asset.secure_url,
    format: asset.format,
    bytes: asset.bytes,
  }],
});
```

---

## 8. Notes

- `npm run seed:admin` creates the first Admin using `ADMIN_EMAIL` /
  `ADMIN_PASSWORD` / `ADMIN_NAME` from `.env`. All other accounts must be
  created by an Admin through `POST /api/users` (each gets a random temporary
  password emailed to them, and `mustChangePassword: true`).
- Submissions use a single document per `(milestone, student)` pair; each
  resubmission pushes a new entry into `versions[]`, preserving full history
  (FR-T4) while `status` always reflects the latest review outcome.
- All mutating actions (user/group/milestone/submission changes, logins,
  password changes) are recorded in `AuditLog` for FR-C3.
