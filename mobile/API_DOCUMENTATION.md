# Student Supervisor System — API Documentation

This document describes every endpoint exposed by the backend, for integrating
a mobile (or any other) client. All endpoints are prefixed with `/api`.

**Base URL:** `https://api-student-supervisor.up.railway.app/api`

Flutter reads this from `lib/src/config/api_config.dart` (override with
`--dart-define=API_URL=...` when building the APK).

---

## 1. How the API responds

Every response is JSON with this envelope:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
```

- `success` is `true` for 2xx responses, `false` otherwise.
- `data` holds the actual payload and varies per endpoint (documented below).
- Error responses look like:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "Valid email required" }]
}
```

**Common status codes:** `200` OK · `201` Created · `400` validation error ·
`401` not authenticated / bad token · `403` authenticated but not allowed
(wrong role, or not your own resource) · `404` not found · `409` conflict
(e.g. duplicate email) · `429` rate limited · `500` server error.

---

## 2. Authentication

Three roles: **admin**, **supervisor**, **student**. Every account is created
by an Admin — there is no public sign-up.

### Token model
- **Access token**: short-lived JWT (default 15 min), returned in the login
  response body. Send it on every request:
  `Authorization: Bearer <accessToken>`
- **Refresh token**: longer-lived JWT (default 7 days), set as an **httpOnly
  cookie** scoped to `/api/auth` by the server on login. Used to silently get
  a new access token without re-entering credentials.

> ⚠️ **Mobile note:** httpOnly cookies require your HTTP client to persist
> and resend cookies automatically (like a browser does). Most native HTTP
> clients (e.g. `axios` on React Native, `Dio` on Flutter, `URLSession` on
> iOS, `OkHttp`/`Retrofit` on Android) support this via a cookie jar/manager,
> but it's usually **not on by default** — you'll need to enable persistent
> cookie storage explicitly, or the refresh flow won't work and the user will
> get logged out after the access token expires (~15 min). If your cookie
> jar setup is inconvenient, ask the backend team about switching the refresh
> token to a response-body value instead of a cookie — it's a small change.

### `POST /auth/login`
Public. Logs in and starts a session.

**Body:**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**Response `data`:**
```json
{
  "user": {
    "_id": "...",
    "fullName": "Amina Yusuf",
    "email": "user@example.com",
    "role": "supervisor",
    "isActive": true,
    "supervisorId": null,
    "groupId": null,
    "phone": null,
    "mustChangePassword": false,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "accessToken": "eyJhbGciOi..."
}
```

If `mustChangePassword` is `true` (true for every account an Admin just
created), the client should force the user to `POST /auth/change-password`
before letting them use the app.

### `POST /auth/refresh`
Public (relies on the refresh cookie). No body. Returns a new access token:
`data.accessToken`. Call this when a request comes back `401` and you haven't
already retried once.

### `POST /auth/logout`
Public. Clears the refresh cookie. No body, no meaningful `data`.

### `GET /auth/me` 🔒
Returns the current user: `data.user` (same shape as login).

### `POST /auth/change-password` 🔒
**Body:**
```json
{ "currentPassword": "temp-pass-from-email", "newPassword": "MyNewPass123" }
```
`newPassword` must be ≥ 8 characters. On success, the refresh token is
invalidated — the user must log in again with the new password.

---

## 3. Users (Admin only)

Admins create every Supervisor/Student/Admin account. A random temporary
password is generated and **emailed to the user** on creation — there is no
way to read it back via the API.

### `POST /users` 🔒 admin
**Body:**
```json
{
  "fullName": "Hodan Ali",
  "email": "hodan@example.com",
  "role": "student",
  "groupId": "64f...optional",
  "supervisorId": "64f...optional, students only",
  "phone": "+252...optional"
}
```
`role` is one of `admin | supervisor | student`. Returns `data.user`
(`201`). Fails `409` if the email is already taken.

### `GET /users` 🔒 admin
Query params: `role`, `groupId`, `supervisorId`, `search` (matches name or
email), `page`, `limit`.
**Response `data`:** `{ users: [...], pagination: { total, page, limit } }`

### `GET /users/:id` 🔒 admin
**Response `data`:** `{ user }`

### `PATCH /users/:id` 🔒 admin
**Body (all optional):**
```json
{ "fullName": "...", "phone": "...", "isActive": false, "supervisorId": "...", "groupId": "..." }
```
Changing `supervisorId` on a student re-assigns them and emails both the
student and the (new) supervisor.

### `DELETE /users/:id` 🔒 admin
Deletes the account. No body.

### `POST /users/:id/assign-supervisor` 🔒 admin
Dedicated shortcut for reassigning a student.
**Body:** `{ "supervisorId": "64f..." }`

### `PATCH /me` 🔒 any role
Updates your **own** profile.
**Body (optional):** `{ "fullName": "...", "phone": "..." }`

---

## 4. Groups (cohorts / batches)

### `POST /groups` 🔒 admin
**Body:** `{ "name": "Cohort 2026", "description": "optional", "term": "Fall 2026" }`
→ `201`, `data.group`

### `GET /groups` 🔒 admin, supervisor
`data.groups` — each includes `studentCount` and `supervisorCount`.

### `GET /groups/:id` 🔒 admin, supervisor
`data` → `{ group, members: [user, ...] }`

### `PATCH /groups/:id` 🔒 admin
**Body (optional):** `{ "name", "description", "term", "isActive" }`

### `DELETE /groups/:id` 🔒 admin
Deletes the group; members are unassigned (`groupId` set to `null`), not
deleted.

---

## 5. Milestones (guidelines & tasks)

A Milestone is a chapter/task a Supervisor publishes. If it has no
`dueDate` it behaves like a standing **guideline**; with a `dueDate` it
behaves like a **task**.

### `POST /milestones` 🔒 supervisor
**Body:**
```json
{
  "title": "Chapter 1 — Introduction",
  "description": "Cover background, problem statement, objectives.",
  "order": 1,
  "dueDate": "2026-09-30",
  "groupId": null,
  "attachments": [ { "originalFilename": "guide.pdf", "publicId": "...", "secureUrl": "https://...", "format": "pdf", "resourceType": "raw", "bytes": 204800 } ]
}
```
- `groupId`: omit/null to publish to **all** of your assigned students, or
  set it to restrict to one group.
- `attachments`: array of Cloudinary asset objects (see §7 for how to get
  these). Optional.
- Automatically emails every affected student.

→ `201`, `data.milestone`

### `GET /milestones` 🔒 any role
Auto-scoped: supervisors see their own milestones, students see their
supervisor's milestones, admins can pass `?supervisorId=`.
`data.milestones`

### `GET /milestones/:id` 🔒 any role
`data.milestone`

### `PATCH /milestones/:id` 🔒 supervisor (own) or admin
**Body (all optional):** `title, description, order, dueDate, attachments, isPublished`

### `DELETE /milestones/:id` 🔒 supervisor (own) or admin
Also deletes all submissions tied to this milestone.

### `GET /milestones/:id/submissions` 🔒 supervisor (own), admin
Lists every student's submission for this milestone, most recently updated
first. Each item's `studentId` is populated with `{ fullName, email }`.
`data.submissions`

---

## 6. Submissions

A submission is **one document per (milestone, student) pair**. Submitting
again for the same milestone doesn't create a new record — it appends a new
entry to `versions[]` and resets `status` to `pending`, so full history is
preserved.

**Submission status:** `pending | approved | changes_requested`

### `POST /submissions` 🔒 student
Creates the first version, or resubmits a new version if one already exists
for this milestone.
**Body:**
```json
{
  "milestoneId": "64f...",
  "files": [
    { "originalFilename": "chapter1.pdf", "publicId": "...", "secureUrl": "https://...", "format": "pdf", "resourceType": "raw", "bytes": 204800 }
  ],
  "note": "First draft, please review. (optional)"
}
```
`files` requires at least one Cloudinary asset object (see §7). Emails the
assigned supervisor. → `201`, `data.submission`

### `GET /submissions/:id` 🔒 admin, the owning student, or the reviewing supervisor
Full submission detail, populated.
**Response `data.submission`:**
```json
{
  "_id": "...",
  "milestoneId": { "_id": "...", "title": "...", "description": "...", "dueDate": "...", "supervisorId": "..." },
  "studentId": { "_id": "...", "fullName": "...", "email": "..." },
  "status": "pending",
  "versions": [
    {
      "versionNumber": 1,
      "files": [ { "originalFilename": "...", "secureUrl": "...", "format": "pdf", "bytes": 204800 } ],
      "note": "...",
      "submittedAt": "..."
    }
  ],
  "comments": [
    { "authorId": { "_id": "...", "fullName": "...", "role": "supervisor" }, "content": "...", "createdAt": "..." }
  ],
  "reviewedBy": "64f...|null",
  "reviewedAt": "...|null",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `PATCH /submissions/:id/approve` 🔒 supervisor (own milestone only)
No body. Marks `status: "approved"`, emails the student.

### `PATCH /submissions/:id/request-changes` 🔒 supervisor (own milestone only)
**Body:** `{ "comment": "Please revise section 2..." }` — **required**.
Marks `status: "changes_requested"`, adds the comment, emails the student.

### `POST /submissions/:id/comments` 🔒 supervisor or the owning student
**Body:** `{ "content": "..." }`
Adds a threaded comment (doesn't change status). → `201`, `data.submission`

---

## 7. File uploads (Cloudinary)

**Files are never uploaded to this API.** The client uploads directly to
Cloudinary using a short-lived signature this API issues, then sends
Cloudinary's response back to the API as JSON (in `attachments`/`files`
fields above).

### `POST /uploads/signature` 🔒 any role
**Body:** `{ "folder": "submissions" }` — `folder` must be one of
`submissions | milestones | avatars`.

**Response `data`:**
```json
{
  "timestamp": 1735689600,
  "signature": "7011ed77...",
  "apiKey": "123456789012345",
  "cloudName": "your_cloud_name",
  "folder": "student-supervisor/submissions/<your_user_id>"
}
```

**Client-side upload flow:**
1. Call the endpoint above to get the signature payload.
2. `multipart/form-data` POST the file directly to:
   `https://api.cloudinary.com/v1_1/{cloudName}/auto/upload`
   with fields: `file`, `api_key` (=`apiKey`), `timestamp`, `signature`,
   `folder`.
3. Cloudinary responds with `{ public_id, secure_url, format, bytes, resource_type, ... }`.
4. Build the attachment object the API expects and send it in your next
   call (e.g. `POST /submissions`):
   ```json
   {
     "originalFilename": "<the file's original name — Cloudinary doesn't return this>",
     "publicId": "<public_id from step 3>",
     "secureUrl": "<secure_url from step 3>",
     "format": "<format from step 3>",
     "resourceType": "<resource_type from step 3>",
     "bytes": "<bytes from step 3>"
   }
   ```

---

## 8. Notifications

In-app notification feed. The same events also trigger an email, but this
is what should drive an in-app bell icon / badge.

### `GET /notifications` 🔒 any role
Query params: `unreadOnly=true`, `page`, `limit`.
**Response `data`:** `{ notifications: [...], unreadCount, pagination }`

Each notification:
```json
{
  "_id": "...",
  "type": "submission_received",
  "message": "Hodan Ali submitted work for \"Chapter 1\".",
  "link": "/supervisor/submissions",
  "isRead": false,
  "createdAt": "..."
}
```
`type` is one of: `assignment | guideline_published | task_created |
submission_received | review_outcome | account_created`.

### `PATCH /notifications/:id/read` 🔒 any role (own notifications)
No body.

### `PATCH /notifications/read-all` 🔒 any role
No body. Marks every unread notification as read.

---

## 9. Settings (global config)

### `GET /settings` 🔒 any role
**Response `data.settings`:**
```json
{
  "academicTerms": ["Fall 2026"],
  "submissionCategories": ["Chapter 1", "Chapter 2"],
  "chapterTemplates": [{ "title": "Chapter 1", "description": "..." }]
}
```

### `PATCH /settings` 🔒 admin
**Body (all optional):** `{ "academicTerms": [...], "submissionCategories": [...], "chapterTemplates": [...] }`

---

## 10. Audit logs (Admin only)

### `GET /audit-logs` 🔒 admin
Query params: `search` (matches action/entity), `entityType`
(`User|Group|Milestone|Submission|Settings`), `userId`, `entityId`, `page`,
`limit`.
**Response `data`:** `{ logs: [...], pagination }`

Each log entry: `{ userId: { fullName, email, role }, action: "submission.approve", entityType: "Submission", entityId: "...", createdAt }`

---

## 11. Relationships & dashboards

### `GET /supervisors/:id/students` 🔒 admin, or that supervisor
`data.students` — list of student user objects.

### `GET /students/:id/supervisor` 🔒 admin, their supervisor, or that student
`data.supervisor` — a user object, or `null` if unassigned.

### `GET /students/:id/milestones` 🔒 admin, their supervisor, or that student
`data.milestones` — all milestones visible to that student.

### `GET /students/:id/progress` 🔒 admin, their supervisor, or that student
**Response `data`:**
```json
{
  "totalMilestones": 5,
  "completed": 2,
  "pending": 3,
  "items": [
    { "milestoneId": "...", "title": "Chapter 1", "order": 1, "status": "approved", "lastSubmittedAt": "..." }
  ]
}
```
`status` per item is `not_submitted | pending | approved | changes_requested`.

### `GET /students/:id/submissions` 🔒 admin, their supervisor, or that student
`data.submissions` — the student's full submission history across all
milestones, each with `milestoneId` populated (`title, order, dueDate`).
Use this to resolve a submission's `_id` for `GET /submissions/:id` when all
you have is a milestone.

### `GET /admin/dashboard` 🔒 admin
**Response `data`:**
```json
{
  "totals": { "totalStudents": 40, "totalSupervisors": 8, "totalGroups": 3, "totalMilestones": 25, "totalSubmissions": 120 },
  "submissionActivity": { "pending": 10, "approved": 95, "changesRequested": 15 },
  "recentGroups": [ { "_id": "...", "name": "...", "studentCount": 12, "supervisorCount": 2 } ],
  "supervisorsWithLoad": [ { "_id": "...", "fullName": "...", "email": "...", "studentCount": 6 } ]
}
```

### `GET /admin/reports` 🔒 admin
Live snapshot aggregated from User, Group, Milestone, and Submission (no Report model). Optional `?groupId=`.

**Response `data`:** `generatedAt`, `summary`, `groups[]`, `overdue[]`, `unassignedStudents[]`, `supervisors[]`.

---

## 12. Quick reference table

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | /health | Public | Liveness check |
| POST | /auth/login | Public | Log in |
| POST | /auth/refresh | Public (cookie) | Get a new access token |
| POST | /auth/logout | Public | Clear session |
| GET | /auth/me | Any | Current user |
| POST | /auth/change-password | Any | Change password |
| POST | /users | Admin | Create account |
| GET | /users | Admin | List accounts |
| GET | /users/:id | Admin | Get account |
| PATCH | /users/:id | Admin | Edit / deactivate / reassign |
| DELETE | /users/:id | Admin | Delete account |
| POST | /users/:id/assign-supervisor | Admin | Assign a student's supervisor |
| PATCH | /me | Any | Edit own profile |
| POST | /groups | Admin | Create group |
| GET | /groups | Admin, Supervisor | List groups |
| GET | /groups/:id | Admin, Supervisor | Get group + members |
| PATCH | /groups/:id | Admin | Edit group |
| DELETE | /groups/:id | Admin | Delete group |
| POST | /milestones | Supervisor | Publish guideline/task |
| GET | /milestones | Any | List (scoped) |
| GET | /milestones/:id | Any | Get one |
| PATCH | /milestones/:id | Supervisor (own), Admin | Edit |
| DELETE | /milestones/:id | Supervisor (own), Admin | Delete |
| GET | /milestones/:id/submissions | Supervisor (own), Admin | All submissions for a milestone |
| POST | /submissions | Student | Submit / resubmit work |
| GET | /submissions/:id | Admin, owner student, reviewing supervisor | Get submission detail |
| PATCH | /submissions/:id/approve | Supervisor | Approve |
| PATCH | /submissions/:id/request-changes | Supervisor | Request changes |
| POST | /submissions/:id/comments | Supervisor, Student | Add feedback comment |
| POST | /uploads/signature | Any | Get signed Cloudinary upload payload |
| GET | /notifications | Any | List own notifications |
| PATCH | /notifications/:id/read | Any | Mark one read |
| PATCH | /notifications/read-all | Any | Mark all read |
| GET | /settings | Any | Get global settings |
| PATCH | /settings | Admin | Update global settings |
| GET | /audit-logs | Admin | Search activity log |
| GET | /supervisors/:id/students | Admin, that supervisor | List a supervisor's students |
| GET | /students/:id/supervisor | Admin, their supervisor, that student | Get a student's supervisor |
| GET | /students/:id/milestones | Admin, their supervisor, that student | List a student's milestones |
| GET | /students/:id/progress | Admin, their supervisor, that student | Milestone completion stats |
| GET | /students/:id/submissions | Admin, their supervisor, that student | A student's full submission history |
| GET | /admin/dashboard | Admin | Platform-wide stats |
| GET | /admin/reports | Admin | Group progress / overdue report |

---

## 13. Rate limits

- `/auth/login` and `/auth/refresh`: 50 requests / 15 min per IP.
- All other `/api/*` routes: 500 requests / 15 min per IP.

A `429` response means you've hit one of these — back off and retry later.
