# CLAUDE.md

Guidance for Claude Code (and any other AI coding agent) working in this repository.

## Project overview

**Student Supervisor System** — a web platform that replaces fragmented
email/chat communication between students and supervisors with a structured
**submission → review → feedback** workflow across three roles: **Admin**,
**Supervisor**, **Student**.

This is a monorepo with two independent apps that talk to each other over
HTTP:

```
/
├── server/    MERN backend (Node.js + Express + MongoDB/Mongoose)
├── client/    React frontend (Vite + Redux Toolkit + React Query)
└── Student_Supervisor_System_Plan__MERN___Cloudinary_.pdf   (source spec)
```

The PDF in the repo root is the original functional-requirements plan (FR-A*,
FR-S*, FR-T*, FR-C*, FR-N* codes referenced throughout the code and this
document all trace back to it). When in doubt about *why* something exists,
check that FR code against the plan.

## Relationship model (Group is the shared workspace)

The relationship between students and supervisors is mediated entirely by
**Group membership**. There is no direct student→supervisor link.

- An Admin creates a Group and assigns BOTH students and supervisor(s) to
  it. `User.groupId` (on both `student` and `supervisor` users) is the
  source-of-truth membership link.
- A Group may have **multiple supervisors** (a `supervisorIds[]` array on
  the Group; each supervisor's own `User.groupId` also points at the
  Group).
- A **Milestone** belongs to exactly one Group (`Milestone.groupId` is
  required). `Milestone.supervisorId` is kept as the "published by"
  attribution field for notifications/audit/UI, but it is NOT the
  authorization scope. Any supervisor in the Group can read every
  milestone, but only the original publisher (or an Admin) can edit or
  delete a milestone.
- A **Submission** is visible to: the submitting student, every
  supervisor in the milestone's Group, and Admins. No student or
  supervisor outside the Group can see another Group's data — even with
  a valid token. This is enforced server-side in the controllers
  (see `Milestone.sharesGroupWithMilestone`, `Submission.supervisorOwnsMilestone`).
- The legacy `User.supervisorId` field and the
  `POST /api/users/:id/assign-supervisor` endpoint have been removed.
  All student↔supervisor wiring is done through Group membership.

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Backend runtime | Node.js (ESM), Express 5 |
| Database   | MongoDB via Mongoose |
| Backend auth | JWT access token (Authorization header) + JWT refresh token (httpOnly cookie) |
| File storage | Cloudinary — signed **direct-to-client** uploads (backend never touches file bytes) |
| Email      | Gmail API via OAuth2 (`googleapis`-free — uses the lighter `google-auth-library` + `nodemailer`) |
| Frontend   | React 19 + Vite, Tailwind CSS v4 |
| Frontend state | Redux Toolkit (auth session only) + TanStack React Query (all server data) |
| Frontend forms | React Hook Form |
| Frontend routing | React Router v7 |

---

## Repository commands

### Backend (`server/`)
```bash
cd server
npm install
cp .env.example .env        # fill in real values — see server/README.md
npm run seed:admin          # bootstraps the first Admin account (one-time)
npm run dev                 # nodemon, http://localhost:5000
npm start                   # production start
```

### Frontend (`client/`)
```bash
cd client
npm install
cp .env.example .env         # VITE_API_URL, VITE_CLOUDINARY_CLOUD_NAME
npm run dev                  # http://localhost:5173
npm run build                # production build to client/dist
npm run lint                 # ESLint (flat config: js recommended + react-hooks + react-refresh)
npm run preview              # preview a production build
```

There is no root-level package.json — always `cd` into `server/` or `client/`
before running npm commands. Run both dev servers concurrently in separate
terminals when working full-stack; the frontend expects the backend at
`VITE_API_URL` (default `http://localhost:5000/api`).

---

## Backend architecture (`server/`)

```
server/
├── server.js                 # entry point: loads env, connects Mongo, starts Express
└── src/
    ├── app.js                # Express app: helmet, cors, rate limiting, route mounting
    ├── config/
    │   ├── db.js              # Mongoose connection
    │   ├── cloudinary.js      # Cloudinary SDK config
    │   └── googleEmail.js     # Gmail OAuth2 → nodemailer transporter (see README "Gmail OAuth2 Setup")
    ├── models/                # User, Group, Milestone, Submission, Notification, AuditLog
    │   └── shared/attachmentSchema.js   # reusable Cloudinary-asset sub-schema
    ├── middleware/
    │   ├── auth.js            # authenticate (JWT) + authorize(...roles) (RBAC)
    │   ├── validate.js        # express-validator error formatter
    │   └── errorHandler.js    # centralized error → JSON response
    ├── controllers/           # one file per resource, thin route handlers
    ├── routes/                # one router per resource + index.js that mounts them all
    ├── services/
    │   ├── email.service.js          # sendEmail() — thin wrapper around the Gmail transporter
    │   ├── notification.service.js   # notify()/notifyMany() — writes a Notification doc AND sends email
    │   ├── cloudinary.service.js     # generateUploadSignature(), destroyAsset()
    │   └── auditLog.service.js       # recordAudit() — never throws, logging must not break requests
    ├── templates/emailTemplates.js   # HTML builders for every FR-N1..N5 email
    └── scripts/seedAdmin.js          # `npm run seed:admin` — one-time bootstrap
```

### Key conventions
- **Every controller is wrapped in `asyncHandler`** (`utils/asyncHandler.js`) so
  thrown errors reach `errorHandler` automatically — never write manual
  try/catch + `res.status(500)` in a controller.
- **Throw `ApiError(statusCode, message)`** for expected failures (validation,
  not-found, forbidden). `errorHandler` also translates Mongoose `CastError`,
  `ValidationError`, and duplicate-key (11000) errors automatically.
- **Every mutating controller action writes an audit log** via
  `recordAudit({ userId, action, entityType, entityId })` — keep this pattern
  when adding new mutations (FR-C3 depends on it).
- **Route → middleware order**: `authenticate` (verifies JWT, loads
  `req.user`) always runs before `authorize(...roles)`. When mounting a new
  router at `/` (like `relationship.routes.js`), apply `authenticate` **per
  route**, not via `router.use()`, or it will swallow 404s for unmatched
  paths as 401s.
- **Cloudinary uploads are client-direct**: the backend only ever issues a
  signed payload (`POST /uploads/signature`) via
  `cloudinary.service.js#generateUploadSignature`. It never receives raw file
  bytes. Attachment references (`{ originalFilename, publicId, secureUrl,
  format, bytes }`) are what get stored in Mongo.
- **Notifications = DB record + email, always together.** Any user-facing
  event (FR-N1–N5, FR-T10) should go through
  `services/notification.service.js#notify()`, which creates the
  `Notification` document and sends the email in one call, and swallows email
  failures so a flaky mail provider never blocks the underlying business
  action (e.g. approving a submission must succeed even if Gmail is down).
- **Submissions are one document per (milestone, student) pair**
  (`Submission` has a unique compound index on `{ milestoneId, studentId }`).
  Resubmission pushes a new entry into `versions[]` rather than creating a
  new document — this is how FR-T4 version history is preserved.
- **JWT**: access tokens are short-lived and sent in the `Authorization:
  Bearer` header; refresh tokens live in an httpOnly cookie scoped to
  `/api/auth` and carry a `refreshTokenVersion` that gets bumped (invalidating
  all sessions) on password change.
- **Group-scoped authorization**: every read/write of a Milestone or
  Submission by a non-Admin user must check that the caller's `User.groupId`
  matches the resource's `groupId`. See
  `milestone.controller.js#sharesGroupWithMilestone` and
  `submission.controller.js#supervisorOwnsMilestone`. Adding a new
  read endpoint on either of these resources without reusing these helpers
  will leak data across groups — always call them.

### Adding a new endpoint — checklist
1. Model change (if needed) in `src/models/`.
2. Controller function in `src/controllers/<resource>.controller.js`, wrapped
   in `asyncHandler`, throwing `ApiError` on failure.
3. Route wiring in `src/routes/<resource>.routes.js` with
   `authenticate` + `authorize(...)`, and `express-validator` chains +
   `validate` middleware for body validation.
4. `recordAudit(...)` call for any mutation.
5. `notify(...)` call if the action should alert a user (check whether it
   maps to an existing FR-N code or needs a new `Notification.type` enum
   value + email template in `templates/emailTemplates.js`).
6. **If the endpoint touches a Milestone or Submission**: also gate
   authorization on shared Group membership. Admins are always allowed;
   students and supervisors must be in the same Group as the resource.

### Group membership management endpoints
- `POST /api/groups/:id/members` — add a student or supervisor to a Group
  (sets their `User.groupId`; supervisors are also added to
  `Group.supervisorIds[]`).
- `DELETE /api/groups/:id/members/:userId` — remove a member from a Group
  (clears `User.groupId` and removes the user from
  `Group.supervisorIds[]` if applicable).
- The same operations are also reachable via `PATCH /api/users/:id` with a
  `groupId` payload (admin-only). The dedicated `/members` endpoints exist
  for the Admin's Group-management UI, which keeps member changes in a
  single place.

---

## Frontend architecture (`client/`)

```
client/src/
├── services/apiClient.js     # single axios instance + every API call + response normalizers
│                              #   - tokenStore: localStorage-backed access token / cached user
│                              #   - request interceptor: attaches Authorization: Bearer <token>
│                              #   - response interceptor: on 401, silently POSTs /auth/refresh
│                              #     (httpOnly cookie) and retries once; on failure, clears
│                              #     tokenStore + dispatches logout()
│                              #   - normalizeUser/Group/Milestone/Submission/Notification:
│                              #     reshape raw API responses into the flatter shape the UI
│                              #     components expect (e.g. `group.code`, `submission.review`)
│                              #   - toApiPayload: reshapes a couple of UI-shaped payloads
│                              #     (milestones, submissions, comments) back into the API's
│                              #     expected body shape before POST/PATCH
├── store/
│   ├── store.js
│   └── slices/authSlice.js   # ONLY global Redux state: { user, token, isAuthenticated }
│                              #   initialized directly from tokenStore (localStorage) so a
│                              #   page reload starts "logged in" before ProtectedLayout's
│                              #   fetchMe() call confirms/refreshes it
├── context/
│   ├── toastContextValue.js  # createContext (split out for react-refresh compliance)
│   ├── useToast.js           # the hook — import from HERE
│   └── ToastContext.jsx      # ToastProvider component + toast UI
├── hooks/useResources.js     # useResource(name) / useDashboardData(role) — the ONLY data-
│                              # fetching hooks; every screen gets its data through these
├── config/navigation.js      # roleRoutes: nav links + icons per role; isSupportedRole()
├── components/
│   ├── common.jsx            # Field, Card, PageIntro, Badge, DataTable, MetricCard,
│   │                          # ActivityFeed, StatusBars, MutationError, RefreshButton, etc.
│   ├── dashboard.jsx         # SummaryTile, PendingActions
│   ├── dialogs.jsx           # ForgotPasswordDialog (informational only — no self-service
│   │                          # reset exists), ConfirmDialog
│   ├── forms.jsx             # UserForm, GroupForm, MilestoneForm, SubmissionForm
│   ├── submission.jsx        # ReviewControls, SubmissionFiles, FeedbackReplyForm
│   └── sidebar/Sidebar.jsx
├── layouts/ProtectedLayout.jsx  # the ONLY router for authenticated screens (mounted at "/*"
│                                 # in App.jsx). Handles: auth gate, mustChangePassword gate
│                                 # (renders ForceChangePasswordScreen instead of any route),
│                                 # role-path gate (`isPathAllowedForRole`), sidebar + topbar
│                                 # chrome, and every `<Route>` for all three roles inline.
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── ForceChangePassword.jsx   # full-page gate, not a normal route — see ProtectedLayout
│   └── shared/WorkspacePages.jsx     # EVERY other screen (~1000 lines): Dashboard, UsersScreen,
│                                       # GroupsScreen, StudentsScreen, MilestonesScreen,
│                                       # SubmissionsScreen, NotificationsScreen, AuditLogsScreen,
│                                       # ProfileScreen, StudentGroupScreen,
│                                       # StudentSupervisorScreen, StudentFeedbackScreen — one
│                                       # component per screen, same file, reused across roles
│                                       # via props (e.g. `allowCreate`, `allowManage`, `scope`)
└── App.jsx                   # top-level routes only: /login, /* → ProtectedLayout, / → redirect
```

**This is intentionally NOT the `pages/<role>/*.jsx` + `api/*.api.js`-per-resource layout you
might expect from a from-scratch build** — the real client consolidates all screens into
`WorkspacePages.jsx` and all API calls into `apiClient.js`. Follow this file's actual
structure, not an idealized one — don't restructure it into many small files unless
explicitly asked to.

### Key conventions
- **All data fetching goes through `useResource(name)` / `useDashboardData(role)`**
  (`hooks/useResources.js`). `useResource` resolves the right endpoint per role internally
  (e.g. `groups` → `/students/:id/group` for a student, `/groups` for admin/supervisor) via
  `getResourceSpec`. Don't call `listResource`/`api.get` directly from a screen component —
  add or extend a resource spec instead.
- **All mutations go through `createResource` / `patchResource` / `deleteResource`**
  (`services/apiClient.js`) inside a `useMutation`, then
  `queryClient.invalidateQueries()` (usually with no key = invalidate everything, since
  screens rarely need fine-grained cache scoping here) on success.
- **Response/payload shape mismatches are papered over in `apiClient.js`, not in screens.**
  If the API returns `groupId` but the UI wants `group`, that reshaping belongs in
  `normalizeGroup` (or a new normalizer), not inlined in a component. Same for outgoing
  payloads — see `toApiPayload`.
- **Auth session**: `authSlice`'s initial state is read synchronously from `tokenStore`
  (localStorage) so the app doesn't flash a logged-out state on reload. `ProtectedLayout`
  then calls `fetchMe()` once on mount to confirm/refresh that cached user; if it 401s, the
  session is cleared and the user is redirected to `/login`. The response interceptor in
  `apiClient.js` handles transparent access-token refresh for every other request.
- **`mustChangePassword` gate**: `ProtectedLayout` checks `user.mustChangePassword` before
  rendering ANY route and renders `ForceChangePasswordScreen` instead if true. This flag is
  set to `true` by the backend on every account creation and every Admin-driven password
  reset (`PATCH /users/:id` with a `password` field) — don't add a way to create/reset a
  password without it, or the user will never be prompted to set their own.
- **File uploads** always go through `uploadFileToCloudinary` in `apiClient.js`, which calls
  `POST /uploads/signature` for a signed payload, then uploads directly to Cloudinary. Never
  add a multipart upload route to the Express backend — that would defeat the direct-upload
  architecture the plan specifies (Section 7).
- **`GroupsScreen`** (in `WorkspacePages.jsx`) is the only place group membership is managed:
  it supports adding/removing BOTH students and supervisors via
  `POST/DELETE /groups/:id/members[/:userId]`. `UsersScreen`'s edit form can also change a
  user's `groupId` directly (`PATCH /users/:id`) — both paths are intentionally supported;
  keep both working if you touch either.
- **One `UsersScreen`, not three.** There used to be separate Create User / Create Student /
  Create Supervisor entry points; they were consolidated into a single `/admin/users` screen
  with a role selector on `UserForm`. Do not reintroduce role-specific creation routes/screens.

### Adding a new screen — checklist
1. If it needs new data, add or extend a resource spec in
   `hooks/useResources.js#defaultResourceSpecs` / `getResourceSpec`.
2. Add the screen component to `pages/shared/WorkspacePages.jsx` (or a new file if it's
   large enough to warrant one — most things live in the shared file today).
3. Register the route in `layouts/ProtectedLayout.jsx`'s inline `<Routes>`.
4. Add a nav entry to `config/navigation.js#roleRoutes` for whichever role(s) should see it
   in the sidebar.

---

## Cross-cutting notes

- **FR traceability**: comments throughout both codebases reference FR codes
  (e.g. `// FR-S5`) matching the plan PDF. Keep this convention when adding
  code tied to a specific requirement — it's the fastest way to check
  "did we cover everything in the plan?"
- **Backend additions beyond the original plan**: `GET
  /api/students/:id/submissions` (self/supervisor/admin scoped) was added
  beyond the plan's literal API map because the frontend has no other way to
  list a student's own submissions or resolve a submission's `_id` from a
  milestone (needed for FR-T5/FR-T7). If you add other "convenience" endpoints
  not in the original API map, document the reason the same way.
- **Environment files**: both `server/.env.example` and `client/.env.example`
  are the source of truth for required config — keep them in sync with any
  new env var you introduce, and never commit real secrets to `.env`.
- **Gmail OAuth2**: see `server/README.md` → "Gmail OAuth2 Setup" for the
  full walkthrough (enable Gmail API → OAuth consent screen → OAuth client →
  OAuth Playground to mint a refresh token). The backend deliberately uses
  `google-auth-library` instead of the full `googleapis` package to keep
  `node_modules` small — don't reintroduce `googleapis` for something this
  small.
