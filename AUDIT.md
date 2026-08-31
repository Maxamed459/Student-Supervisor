# AUDIT.md — Student Supervisor System Client/Backend Audit

Date: 2026-08-30
Auditor: Claude (automated)

## Executive summary

The current implementation diverges from CLAUDE.md in many places. The
client is NOT structured as `pages/<role>/*.jsx` with `src/api/*.api.js`
and `components/ui`, `components/layout`, etc. Instead, the real client
uses a flat `pages/shared/WorkspacePages.jsx` mega-file plus one
`src/services/apiClient.js` for all API calls. CLAUDE.md is therefore
partially out-of-date. The relationship model is also fundamentally
mis-modeled: the code uses `User.supervisorId` as the primary
student↔supervisor link, with Group as a "label" attached to a student,
and `Milestone.groupId` is optional. This is the wrong model and must be
replaced (see PHASE 2).

---

## 1. Backend Endpoint Coverage Gaps

### 1.1 Backend routes (as built)

Source: `server/src/routes/*.js` mounted via `routes/index.js` at
`/api/...`. All controllers read in full for this audit.

| Method | Path | Required role | Body / Query | Response shape |
|---|---|---|---|---|
| GET | `/api/health` | public | — | `{ status: "ok" }` |
| POST | `/api/auth/login` | public | `{ email, password }` | `{ user, accessToken }` |
| POST | `/api/auth/refresh` | public (uses cookie) | — | `{ accessToken }` |
| POST | `/api/auth/logout` | public | `{ refreshToken? }` | `null` |
| GET | `/api/auth/me` | authenticated | — | `{ user }` |
| POST | `/api/auth/change-password` | authenticated | `{ currentPassword, newPassword }` | `null` |
| GET | `/api/users` | admin | query: role, groupId, supervisorId, search, page, limit | `{ users[], pagination{} }` |
| POST | `/api/users` | admin | `{ fullName, email, password, role, groupId?, supervisorId?, phone? }` | `{ user, password }` (cleartext returned once) |
| GET | `/api/users/:id` | admin | — | `{ user }` |
| PATCH | `/api/users/:id` | admin | `{ fullName?, phone?, isActive?, supervisorId?, groupId? }` | `{ user }` |
| DELETE | `/api/users/:id` | admin | — | `null` |
| POST | `/api/users/:id/assign-supervisor` | admin | `{ supervisorId }` | `{ user }` |
| GET | `/api/groups` | admin, supervisor | — | `{ groups[] }` (supervisor scope: only own groups) |
| GET | `/api/groups/:id` | admin, supervisor | — | `{ group, members[] }` |
| POST | `/api/groups` | admin | `{ name, code?, description?, term?, room/roomId?, supervisor/supervisorId?, students? }` (4 students required if `students` provided) | `{ group }` |
| PATCH | `/api/groups/:id` | admin | `{ name?, code?, description?, term?, roomId?, supervisorId?, isActive? }` | `{ group }` |
| DELETE | `/api/groups/:id` | admin | — | `null` |
| POST | `/api/groups/rooms` | admin | `{ name, code, description? }` | `{ room }` |
| GET | `/api/groups/rooms` | admin, supervisor | — | `{ rooms[] }` |
| GET | `/api/milestones` | admin, supervisor, student | query: supervisorId? (admin) | `{ milestones[] }` |
| GET | `/api/milestones/:id` | admin, supervisor, student | — | `{ milestone }` |
| POST | `/api/milestones` | supervisor | `{ title, description?, order?, dueDate?, groupId?, attachments? }` | `{ milestone }` |
| PATCH | `/api/milestones/:id` | supervisor (owner), admin | `{ title?, description?, order?, dueDate?, attachments?, isPublished? }` | `{ milestone }` |
| DELETE | `/api/milestones/:id` | supervisor (owner), admin | — | `null` |
| GET | `/api/milestones/:id/submissions` | supervisor, admin | — | `{ submissions[] }` |
| GET | `/api/submissions` | admin, supervisor, student | — | `{ submissions[] }` (scoped by role) |
| POST | `/api/submissions` | student | `{ milestoneId, files[], note? }` | `{ submission }` |
| GET | `/api/submissions/:id` | admin, supervisor, student | — | `{ submission }` |
| PATCH | `/api/submissions/:id/approve` | supervisor (owner) | — | `{ submission }` |
| PATCH | `/api/submissions/:id/request-changes` | supervisor (owner) | `{ comment }` (required) | `{ submission }` |
| POST | `/api/submissions/:id/comments` | supervisor, student | `{ content }` | `{ submission }` |
| GET | `/api/uploads/signature` | all roles | `{ folder }` (one of submissions/milestones/avatars) | `{ timestamp, signature, apiKey, cloudName, folder }` |
| GET | `/api/notifications` | authenticated | query: unreadOnly, page, limit | `{ notifications[], unreadCount, pagination{} }` |
| PATCH | `/api/notifications/:id/read` | authenticated | — | `{ notification }` |
| PATCH | `/api/notifications/read-all` | authenticated | — | `null` |
| GET | `/api/audit-logs` | admin | query: search, userId, entityType, entityId, page, limit | `{ logs[], pagination{} }` |
| GET | `/api/settings` | authenticated | — | `{ settings }` |
| PATCH | `/api/settings` | admin | `{ academicTerms?, submissionCategories?, chapterTemplates? }` | `{ settings }` |
| PATCH | `/api/me` | authenticated | `{ fullName?, phone? }` | `{ user }` |
| GET | `/api/supervisors/:id/students` | admin, supervisor | — | `{ students[] }` (scope: own students) |
| GET | `/api/students/:id/supervisor` | admin, supervisor, student | — | `{ supervisor }` (or null) |
| GET | `/api/students/:id/group` | admin, supervisor, student | — | `{ groups[] }` (or empty) |
| GET | `/api/students/:id/milestones` | admin, supervisor, student | — | `{ milestones[] }` |
| GET | `/api/students/:id/progress` | admin, supervisor, student | — | `{ totalMilestones, completed, pending, items[] }` |
| GET | `/api/students/:id/submissions` | admin, supervisor, student | — | `{ submissions[] }` |
| GET | `/api/admin/dashboard` | admin | — | `{ totals{}, submissionActivity{}, recentGroups[], supervisorsWithLoad[] }` |

### 1.2 Client calls (as built)

Source: every `apiClient.js` call site, every `useResource` invocation,
every `useMutation` in `WorkspacePages.jsx` / `LoginPage.jsx` /
`dialogs.jsx`, and `useDashboardData` fan-out. There is no
`src/api/*.api.js` set — the client uses a single `apiClient.js`.

| HTTP | URL | From | Body / Params |
|---|---|---|---|
| POST | `/auth/login` | LoginPage | `{ email, password }` |
| POST | `/auth/forgot-password` | ForgotPasswordDialog | `{ email }` |
| POST | `/auth/forgot-password/verify` | ForgotPasswordDialog | `{ email, otp }` |
| POST | `/auth/forgot-password/reset` | ForgotPasswordDialog | `{ email, otp, password }` |
| POST | `/auth/logout` | ProtectedLayout | `{ refreshToken }` |
| GET | `/auth/me` | ProtectedLayout | — |
| GET | `/users` | `useResource('users')` (admin) | — |
| GET | `/users?role=student` | `useResource('students')` | — |
| GET | `/users?role=supervisor` | `useResource('supervisors')` | — |
| GET | `/supervisors/:id/students` | `useResource('students')` for supervisors | — |
| POST | `/users` | UsersScreen (create) | `{ fullName, email, password, role, studentId?, staffId? }` (NO groupId) |
| GET | `/groups` | `useResource('groups')` (everyone) | — |
| GET | `/groups/rooms` | `useResource('rooms')` (admin/supervisor only) | — |
| POST | `/groups` | GroupsScreen | `{ name, code, room, supervisor, students[] }` (4 required) |
| POST | `/groups/rooms` | GroupsScreen | `{ name, code, description }` |
| GET | `/students/:id/group` | `useResource('groups')` for students | — |
| GET | `/milestones` | `useResource('milestones')` | — |
| POST | `/milestones` | MilestonesScreen | `{ title, description, order, group, dueAt, status, allowedFileTypes }` (toApiPayload translates `group` → `groupId`, `dueAt` → `dueDate`, `status` → `isPublished`) |
| GET | `/submissions` | `useResource('submissions')` | — |
| GET | `/students/:id/submissions` | `useResource('submissions')` for students | — |
| POST | `/submissions` | SubmissionsScreen | `{ milestone, group, versions: [{ notes, files }] }` (toApiPayload reshapes to `{ milestoneId, files, note }`) |
| PATCH | `/submissions/:id/approve` | SubmissionsScreen review | `{ comment }` |
| PATCH | `/submissions/:id/request-changes` | SubmissionsScreen review | `{ comment }` |
| POST | `/submissions/:id/comments` | StudentFeedbackScreen | `{ message }` (toApiPayload reshapes to `{ content }`) |
| POST | `/uploads/signature` | SubmissionForm | `{ folder: 'submissions' }` |
| GET | `/notifications` | `useResource('notifications')` | — |
| PATCH | `/notifications/:id/read` | NotificationsScreen | `{}` |
| GET | `/audit-logs` | `useResource('auditLogs')` (admin only) | — |
| GET | `/meetings` | `useDashboardData` (always) | — |
| GET | `/progress` | `useDashboardData` (admin/supervisor) | — |
| GET | `/students/:id/progress` | `useResource('progress')` for students | — |

### 1.3 Gaps / dead capability / wrong-shape calls

1. **`/api/me` is never called by the client.** `ProtectedLayout` uses
   `/auth/me` instead. The single PATCH `/api/me` endpoint in
   `me.routes.js` is dead — the client `ProfileScreen` is a static
   read-only view of the Redux `user` and has no edit form.
2. **Forgot-password endpoints (`/auth/forgot-password*`) do not exist
   in the backend.** `dialogs.jsx#ForgotPasswordDialog` calls
   `/auth/forgot-password`, `/auth/forgot-password/verify`, and
   `/auth/forgot-password/reset` — all three will 404 against
   `routes/index.js`. This is a real broken integration.
3. **`/api/meetings` is requested by the client but does not exist
   on the server.** `useDashboardData` always fires `useResource('meetings')`,
   and the dashboard `metrics` for students use `meetings.length` and
   `PendingActions` reads `meetings.filter(status === 'scheduled')`. The
   server has no meetings routes/controller/model. Every dashboard
   render logs a 404 to the console.
4. **`/api/progress` is requested by the client but does not exist
   on the server for non-students.** `getResourceSpec` returns
   `[null, 'progress']` for admin/supervisor so the call is suppressed
   in that path, but the spec is also requested by `useResource('progress')`
   for non-students in `useDashboardData` — `useResource` will fall back
   to the default path because `user?.role` is admin/supervisor, so
   admin/supervisor will issue a GET `/api/progress` that returns 404.
   (This is the source of the "PENDING REVIEWS" being 0 + console
   404 noise on the supervisor dashboard — actually pendingReviews
   uses submissions, not progress; progress shows up as 404 in network.)
5. **`useDashboardData` issues a `useResource('users')` call even when
   `role === 'admin'` is the only one allowed — that's correct, but the
   resulting list also includes admins, so the "TOTAL STUDENTS" metric
   displays the wrong count when filtering is not applied on the
   client.** The `listUsers` endpoint returns the user-mix; the client
   reads `students.length` which actually equals all users. This is a
   small client bug, not a backend gap, but it's caused by the same
   over-fetching pattern.
6. **`POST /api/groups/rooms` is called by the client but its
   payload doesn't include a `description` field in the form — fine
   (optional).** No gap.
7. **`POST /api/users` (admin) is called with `{ studentId, staffId }`
   fields that the backend does not read or persist.** Cosmetic noise.
8. **`/api/auth/logout` accepts a body but `logoutRequest` in
   `apiClient.js` only sends the refresh token if it's still in
   localStorage** — but the backend keeps the refresh token in an
   httpOnly cookie, not localStorage. This means logout never
   invalidates the server-side refresh cookie. Real broken integration.
9. **SettingsScreen has its own "the backend currently does not expose
   settings endpoints" placeholder, but `/api/settings` DOES exist.**
   The Admin Settings screen is dead code on the client; the real
   endpoint is unused.
10. **`POST /api/users/:id/assign-supervisor` is a backend endpoint that
    no client code calls.** Combined with the fact that
    `User.supervisorId` is the primary link in many places (see PHASE 2),
    this is the model the client is *intended* to use but actually
    doesn't.
11. **`PATCH /api/users/:id` and `DELETE /api/users/:id` exist but are
    never called by the client.** The Users screen has no edit, no
    deactivate, no change-group, and no delete actions.
12. **`PATCH /api/me` is never called by the client.** No profile-edit
    form.
13. **`PATCH /api/notifications/read-all` exists but is never called.**
    The Notifications screen has no "mark all read" button.
14. **`GET /api/admin/dashboard` exists but is never called.** The
    AdminDashboard component uses a fan-out of `/users`, `/groups`,
    `/submissions`, `/audit-logs`, etc. and computes its own totals
    client-side, returning a slightly different shape than the
    backend-supplied one.
15. **`POST /api/users/:id/assign-supervisor` is currently a duplicate
    of `PATCH /api/users/:id` with `supervisorId`** — both update
    `User.supervisorId` and both notify. The client uses neither, so
    neither is the "real" path. Both go away in PHASE 2.
16. **`POST /api/groups` requires exactly 4 students** (`group.controller.js`
    line 41). This is hard-coded into the server. The client form
    enforces this too (`GroupForm` caps at 4), but a Group with
    multiple supervisors (the new model) cannot be created via this
    endpoint at all — there's no `supervisors[]` (plural) field. The
    backend `Group.supervisorId` is singular. This is one of the
    biggest blockers for the new model.
17. **The client `getGroupForStudent` returns `{ groups: [...] }` (a
    list)** but `StudentGroupScreen` expects a single group via
    `groups.data?.[0]`. The shape mismatch is papered over by reading
    the first element, but if a student is in multiple groups this
    silently drops the others. (See PHASE 2: the new model has
    multiple supervisors per Group, not multiple groups per student;
    but the client should still treat the data shape correctly.)
18. **`GET /api/users` supports `supervisorId` query param** for
    filtering. The client never uses it. Harmless.

### 1.4 Permission mismatches (UI vs backend RBAC)

The `authorize(...)` middleware denies roles not in the list per route.
The client UI does not restrict by role in most cases — it shows the
same screens to all roles and relies on the server's 403. Confirmed
issues:

1. **Students are routed to `/supervisor/dashboard` etc. by URL
   tampering.** `ProtectedLayout` redirects unknown paths to
   `/${user.role}/dashboard` only on `*`; a student manually typing
   `/admin/dashboard` in the URL will see the Admin Dashboard
   component. The page loads (server is queried, returns 403 for
   `/users`, `/audit-logs` etc.) but the `Dashboard` itself does
   not role-gate. Severity: medium. Should add a `RoleRoute`-style
   guard for `/admin/*` and `/supervisor/*` URLs. (The plan's
   `RoleRoute.jsx` is referenced in CLAUDE.md but does not exist in
   the current `client/src/`.)

2. **`SettingsScreen` is admin-only on the server (PATCH) but
   `getSettings` is open to all roles.** The Admin sidebar shows
   Settings; the Supervisor and Student sidebars do not. No
   cross-role leakage.

3. **`/api/users` is admin-only on the server**, but
   `useDashboardData` calls `useResource('students')` and
   `useResource('supervisors')` for *both* admin and supervisor.
   The supervisor-scoped branch in `getResourceSpec` correctly
   switches to `/supervisors/${user._id}/students`, so the call
   is fine for supervisors. But the *admin* path uses
   `/users?role=student` and `/users?role=supervisor`. The data
   includes `supervisorId` and `groupId` only as ObjectIds in the
   raw response; the client normalizer reads them as embedded
   objects. So the "Supervisors" card on the admin page is missing
   its `group` field unless populated. (Cosmetic.)

4. **`/api/groups` is admin+supervisor, but the student's
   `useResource('groups')` call in `getResourceSpec` switches to
   `/students/${user._id}/group`.** That endpoint returns
   `{ groups: [...] }` (a list of one). The client normalizer maps
   that via `normalizeGroup` to the same key. This works.

5. **`SubmissionsScreen` is rendered for both supervisor and
   student routes** (with `allowReview=true` for supervisor,
   `allowCreate=true` for student). The Approve / Request-changes
   controls are in the same component. The student side of the
   page is reachable at `/student/submissions` and shows the
   review-controls form (it'll error on submit because the
   server-side check `assertSupervisorOwnsMilestone` 403s the
   student). UI bug, not security bug: the buttons shouldn't
   appear in the student view at all. Same for
   `FeedbackReplyForm` — it only appears in the student's
   feedback page, so that's fine, but the form *name* `FeedbackReplyForm`
   lives in `submission.jsx` and is only wired into
   `StudentFeedbackScreen`. The buttons in `ReviewControls` are
   not gated by role in the component itself.

6. **`auditLogs` is admin-only** — client correctly gates via
   `useDashboardData(role === 'admin')`. ✓

7. **`auditLogs` endpoint allows `userId`/`entityId`/`entityType`
   query params** for filtering. The client never sends them.

8. **Notification `markAsRead` allows any user to mark their own
   notifications** (server scopes by `userId: req.user._id`). ✓

9. **`/api/auth/change-password` is the only password-change flow
   wired up** but no client UI calls it. CLAUDE.md mentions a
   `ForceChangePassword` page — that page does not exist in
   the current client.

---

## 2. Admin Dashboard Findings — `Create User` duplication

### 2.1 Current state

`ProtectedLayout.jsx` lines 89–97 register three admin routes that all
render the same `UsersScreen` component with different props:

| Route | Props | Effect |
|---|---|---|
| `/admin/users` | `allowCreate`, `roleFilter=""`, `title="Users"` | Shows full `UserForm` (no `fixedRole` — role selector visible). |
| `/admin/students` | `allowCreate`, `roleFilter="student"`, `title="Students"` | `UserForm` is rendered with `fixedRole="student"` — the role selector is hidden, role is locked. |
| `/admin/supervisors` | `allowCreate`, `roleFilter="supervisor"`, `title="Supervisors"` | Same as above, locked to supervisor. |

All three submit the same `POST /api/users` mutation. The `Create
Student` and `Create Supervisor` tabs are therefore pure-UX
duplicates of the "Create User" form: they hard-code the `role`
field but the same backend endpoint accepts any role.

This matches the brief's "three entry points that can all create any
role" observation.

The `UserForm` (forms.jsx) also has two cosmetic fields —
`studentId` / `staffId` — that the backend ignores.

### 2.2 Other Admin UI problems surfaced by the audit

- The Users screen has **no edit / deactivate / delete / change-group
  actions**. `PATCH /api/users/:id` and `DELETE /api/users/:id` are
  unused.
- The Groups screen lets the Admin **create a group with one
  supervisor and four students**, but cannot add an existing
  supervisor to a group, cannot remove a member, and cannot move a
  student into a different group from the groups UI. The new model
  (see PHASE 2) makes this much worse: there can be more than one
  supervisor per group.
- The Groups screen also lets the Admin create a Room inline. No
  edit / delete room.

---

## 3. Relationship-Model Findings

### 3.1 The wrong assumptions in code

- **`User.supervisorId` is the primary student↔supervisor link** in:
  - `User` model (line 23)
  - `Group` model (line 12, `Group.supervisorId` — single)
  - `Milestone` model — the `supervisorId` field is the *authorization
    scope*; the milestone is "owned by" the supervisor and only they
    (or admin) can edit/delete it. `Milestone.groupId` is OPTIONAL.
  - `milestone.controller.js` — `listMilestones` filters by
    `supervisorId` for the student (line 78) and supervisor (line 73)
    and only adds group as a secondary filter (`$or: [{ groupId: null
    }, { groupId: req.user.groupId }]`).
  - `submission.controller.js` — `createOrResubmit` 403s any student
    whose `supervisorId` does not match the milestone's
    `supervisorId` (line 38-43). `listSubmissionsForMilestone` is
    scoped to the supervisor who owns the milestone.
    `getSubmission`, `addComment`, `decide` (approve/request-changes)
    all use `milestone.supervisorId === req.user._id` as the access
    predicate.
  - `relationship.controller.js` — `listStudentsForSupervisor` keys
    on `User.supervisorId`. `getSupervisorForStudent` reads
    `student.supervisorId`. `getGroupForStudent` requires the
    supervisor to be the student's assigned supervisor.
    `listMilestonesForStudent` requires
    `student.supervisorId === req.user._id`. `getStudentProgress`
    uses `student.supervisorId` to find the milestones.
  - `group.controller.js` — `listGroups` (supervisor scope) finds
    group ids where any student has `supervisorId === req.user._id`,
    then returns the group with `supervisorId === req.user._id`. So
    a supervisor in a group with a different `supervisorId` is
    blocked. `createGroup` accepts a single `supervisorId`.
  - `user.controller.js` — `createUser` accepts `supervisorId` and
    stores it on the user. `updateUser` patches it.
  - `emailTemplates.js` — `assignmentEmail` is the only template
    used.

  Result: there is NO path for a Group to have multiple supervisors
  and stay coherent — the system picks ONE supervisor per group (the
  `Group.supervisorId`), and each student can be tied to one
  supervisor regardless of group membership.

- **`Milestone.groupId` is OPTIONAL** (`Milestone.js` line 9). A
  milestone can exist without a group. The `listMilestones` student
  branch shows a milestone if `groupId === null` (broadcast to all
  of the supervisor's students) OR `groupId === student.groupId`.
  This means a "global" milestone leaks to every student of that
  supervisor.

- **A student can be in a Group but be linked to a different
  supervisor** — `User.updateUser` allows changing
  `supervisorId` independently from `groupId`. The two are
  decoupled.

- **No cross-Group authorization enforcement at the
  Milestone/Submission level.** A supervisor can read any
  submission whose `milestoneId` belongs to them, but not a
  submission for another supervisor's milestone — that part is
  correctly gated. But a student in Group A can be linked to a
  supervisor whose milestones are in Group B (or no group at all).
  And the supervisor can see the student's group without that group
  necessarily containing them.

### 3.2 Migration note

The brief acknowledges this is pre-launch. The migration is therefore
a schema change without a real-data-preservation concern, but the
code must be hardened so that:

1. **`User.supervisorId` is removed.** Any document with a non-null
   `supervisorId` is now meaningless; existing data would be
   cleaned by deleting or zeroing the field. A one-liner migration
   script can do this for any seeded data: `db.users.updateMany({},
   { $unset: { supervisorId: "" } })`.
2. **`Group.supervisorId` (singular) is replaced by a list**
   `Group.supervisorIds[]` (or `Group.supervisors[]`). For
   pre-launch, no data is present; for any seeded demo data, run
   `db.groups.updateMany({}, { $set: { supervisorIds: [] },
   $unset: { supervisorId: "" } })`.
3. **`Milestone.groupId` becomes REQUIRED.** Any milestone without
   a group becomes invalid; for a clean pre-launch, drop the
   collection or set `groupId` to the single demo group.
4. **Submissions are not directly affected by the relationship
   model change** (they're already keyed on milestone × student).
   The `getSubmission` / `decide` authorization will switch from
   `milestone.supervisorId === req.user._id` to "caller shares a
   Group with the milestone's group" (or is the student who
   submitted it, or admin).

---

## 4. Other notes

- `client/src/store/slices/submissionsSlice.js` is empty.
- The client uses `localStorage` for access token; CLAUDE.md says
  the design has the refresh token in an httpOnly cookie and the
  access token in the header. `tokenStore` puts the **refresh token
  in localStorage** (`ss_refresh_token`) and sends it to `/auth/logout`
  as a body, but the server stores it in a cookie. This is a
  functional mismatch: the localStorage refresh token is unused
  by the server; the server's cookie is invisible to the client
  and therefore never cleared on logout (the server's
  `res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' })`
  does clear it, but the client never knows). Net effect: logout
  is inconsistent and the client never calls `/auth/refresh`
  automatically because the client never sees a 401 to trigger
  it (the axios instance has no response interceptor — only a
  request interceptor that attaches the token). This is fine for
  a 15-minute access token but means a logged-out cookie can
  still mint a new access token until it expires. Severity: medium
  for the brief's scope, but the spec says "access token in
  Authorization header + refresh token in httpOnly cookie" — the
  client implementation partially does this. Out of scope for
  PHASES 1-4 but worth a note in the response.
- The client's `useDashboardData` is the only fan-out point;
  individual pages don't use React Query for non-list state
  (e.g. SettingsScreen is empty).
- The `RolesRoute`-style guard referenced in CLAUDE.md does not
  exist; the client relies on the server 403s.
- `eslint` flat config exists (`eslint.config.js`); not all
  warnings surface in build. The brief says "the React Compiler
  plugin" but the current `eslint.config.js` does not include
  it. I did not change this — the brief was descriptive of a
  planned state.

---

## 5. Summary of changes made

### PHASE 2 — Relationship model
- `User.supervisorId` field REMOVED from the schema
  (was: line 23 of `User.js`).
- `Group.supervisorId` (singular) REMOVED, replaced with
  `Group.supervisorIds[]` (array of ObjectIds). The
  source of truth for a supervisor's group membership is
  still their own `User.groupId`; the array on the Group
  is a fast lookup of "which supervisors belong here".
- `Milestone.groupId` is now REQUIRED (was `default: null`).
- `POST /api/users/:id/assign-supervisor` and the
  `assignSupervisor` controller function DELETED.
- New endpoints:
  - `POST /api/groups/:id/members` — add a student or
    supervisor to a Group.
  - `DELETE /api/groups/:id/members/:userId` — remove a
    member from a Group.
- New helpers in `group.controller.js`: `addMember` /
  `removeMember` (with `save: false` option so callers
  can batch persists).
- Authorization rewritten:
  - `milestone.controller.js#sharesGroupWithMilestone`
    is the new read/edit gate.
  - `submission.controller.js#supervisorOwnsMilestone`
    is the new review gate.
  - `relationship.controller.js` listStudentsForSupervisor
    now aggregates across all of the supervisor's groups
    (with the groupId attached to each student row), and
    `getSupervisorForStudent` returns the full supervisor
    roster of the student's group (not a single
    supervisor).
- Migration note: pre-launch, no real data exists. If
  any seeded data does exist, the equivalent of:
  `db.users.updateMany({}, { $unset: { supervisorId: "" } })`
  and `db.groups.updateMany({}, { $set: { supervisorIds: [] },
  $unset: { supervisorId: "" } })` will clean it up.

### PHASE 3 — Admin user management
- `UsersScreen` consolidated into a single screen with a
  role selector on the form. The separate `/admin/students`
  and `/admin/supervisors` routes and sidebar entries are
  removed.
- The screen now supports edit, delete, activate/deactivate,
  and group assignment on a single page.
- The Group management screen has been rewritten to allow
  adding/removing BOTH students and supervisors as members,
  and to manage the supervisor roster of a group.

### PHASE 4 — Dashboard re-audit
- Admin dashboard: now reads from the new resource shapes.
  "TOTAL STUDENTS" and "TOTAL SUPERVISORS" use the role-
  filtered `/users?role=…` query (correct). "STUDENT GROUPS"
  is the count of all groups (correct).
- Supervisor dashboard: "MY STUDENTS" is now the count from
  `/supervisors/:id/students` which aggregates across the
  supervisor's groups. "MY GROUPS" is the count of groups
  the supervisor belongs to. "PENDING REVIEWS" is the
  count of `pending` submissions in those groups. The
  milestone list (`/supervisor/guidelines`) is scoped to
  the supervisor's groups with a per-Group switcher.
- Student dashboard: "MILESTONES" is the count of milestones
  in the student's group. "SUBMISSIONS" is the student's own
  submissions (scoped to their group). The student's
  `StudentGroupScreen` and `StudentSupervisorScreen` now
  show all supervisors in the group (plural-aware).

### Other client changes
- Removed the broken `/meetings` and admin/supervisor
  `/progress` resource calls — they were 404-ing on every
  page load.
- Added a Group switcher on the supervisor's Milestones
  page and on the student's Submissions / Milestones pages
  (the switcher is hidden if the user is in exactly one
  group).
- The `useToast` hook was split out of `ToastContext.jsx`
  into `context/useToast.js` + `context/toastContextValue.js`
  to satisfy `react-refresh/only-export-components`.
- The client `UserForm` now uses a `key` prop to reset
  internal state when switching between edit targets,
  avoiding a `setState in useEffect` that the React
  Compiler plugin flagged.
- `logoutRequest` no longer tries to send a refresh token
  in the body — the server's httpOnly cookie is the real
  source of truth, and the localStorage `ss_refresh_token`
  entry was always null.
- Pre-existing broken endpoints left alone (out of scope):
  - `POST /api/auth/forgot-password*` (no backend
    implementation; the ForgotPasswordDialog will 404).
  - `GET /api/meetings` (no backend; the Dashboard no
    longer requests it).
  - `GET /api/progress` for non-students (no backend;
    non-students now get an empty array instead of a 404).

### Verification
- `npx vite build` passes (client).
- `npx eslint .` passes (client).
- `node --check` on every `server/src/**/*.js` passes.
- A standalone smoke test exercises the
  `sharesGroupWithMilestone` and `supervisorOwnsMilestone`
  helpers against a fixture of two groups, two supervisors,
  two students, and an admin. 19/19 cases pass (see
  `/tmp/isolation-smoke.mjs`). The test confirms that:
  - A student in Group A cannot read Group B milestones.
  - A supervisor in Group A cannot read Group B milestones.
  - A supervisor in two groups only sees each Group's
    data through the controller's groupId-distinct()
    aggregation (the helper itself returns true for the
    group the supervisor is in; the list endpoint
    iterates the union).
  - An admin sees every Group.

### Deliberately left as-is
- The `assignmentEmail` template in
  `templates/emailTemplates.js` is no longer called from
  any controller (since direct student↔supervisor
  assignment is gone) but is kept for the new "added to
  group" notification that may want a similar wording.
  Removing it is a one-line delete if you'd rather not
  keep it.
- The `client/src/store/slices/submissionsSlice.js` is
  empty and unused. Per CLAUDE.md, the Redux store is
  for session state only; this empty slice was
  pre-existing dead code. Not removed because the brief
  says not to introduce a different style — the file is
  a stub that the brief doesn't ask to remove.
- The brief's PHASE 7 (force-change-password) was not
  in scope; the change-password endpoint exists on the
  server (`POST /api/auth/change-password`) but the
  client `LoginPage` and `ProtectedLayout` don't gate
  on `mustChangePassword` yet.
- ESLint's React Compiler plugin is referenced in
  CLAUDE.md but is not present in `eslint.config.js`
  — the comment about it was descriptive of a planned
  state, not a current one. Not changed in this pass.

---

## 6. Follow-up pass (Claude, direct implementation)

Verified the PHASE 2–4 claims above against the actual code (not just this
document) and confirmed the group-centric model and the Admin
Users/Groups consolidation are genuinely implemented correctly. Fixed the
following real bugs/gaps found during that verification:

### Backend
- **`user.controller.js#updateUser` data-loss bug**: changing a user's
  `groupId` in the same request as `fullName`/`phone`/`isActive` silently
  discarded those other field changes (the group-change branch re-fetched
  and saved a separate copy of the user document instead of the one
  already mutated in memory). Rewrote to mutate and save a single
  document; group-roster updates now use targeted `Group.updateOne`
  instead of the `addMember`/`removeMember` helpers (which are still used
  by `deleteUser`, where the double-fetch is harmless).
- **Password reset was a client/server mismatch**: `UserForm` already
  sends an optional `password` field when editing a user ("Reset password
  — leave blank to keep the current password"), but `updateUser` never
  read it — resets silently did nothing. Added real handling: hashes the
  new password, sets `mustChangePassword: true`, and bumps
  `refreshTokenVersion` to invalidate existing sessions for that user.
- **No emails were being sent anywhere.** `accountCreatedEmail` had been
  deleted from `emailTemplates.js` and nothing called `notify()` in
  `user.controller.js` or `group.controller.js`, despite the original
  spec's core requirement for Gmail-based automated notifications.
  Restored:
  - `accountCreatedEmail` template + welcome email on `POST /users`.
  - New `groupAssignmentEmail` template + "added to group" email fired
    from `createGroup`, `addGroupMember`, and the group-changing branch
    of `updateUser`.
  All calls are best-effort via the existing `notify()` helper, which
  already swallows email failures so they can never block the underlying
  request.

### Frontend
- **No silent token refresh.** `apiClient.js` had a request interceptor to
  attach the access token but no response interceptor — once the 15-minute
  access token expired mid-session, every request would just fail with a
  raw 401 instead of transparently refreshing via the httpOnly cookie.
  Added a standard refresh-and-retry response interceptor.
- **`ForgotPasswordDialog` called three endpoints that don't exist**
  (`/auth/forgot-password`, `/forgot-password/verify`,
  `/forgot-password/reset` — a full OTP flow with no backend
  implementation). Replaced with a simple dialog explaining that password
  resets are Admin-managed, matching how the system actually works.
- **`mustChangePassword` was never enforced.** The flag is set correctly
  on every Admin-created or Admin-reset account, but nothing in the client
  checked it — users could never be forced to (or given the means to) set
  their own password. Added:
  - `ForceChangePasswordScreen` (`pages/auth/ForceChangePassword.jsx`),
    rendered by `ProtectedLayout` in place of any route whenever
    `user.mustChangePassword` is true.
  - A real "Change password" form in `ProfileScreen` (previously a static,
    read-only view) for voluntary password changes, plus an "Edit
    profile" form wired to the previously-unused `PATCH /me` endpoint.
- **Admin's own Profile link 404'd.** `/admin/profile` was never
  registered as a route (only `supervisor`/`student` had it), so clicking
  the topbar avatar as an Admin silently bounced back to the dashboard.
  Added the route and a Profile nav entry for Admin.

### Verification
- `node --check` across every `server/src/**/*.js` file: pass.
- Full server module graph load test (`import('./src/app.js')` with dummy
  env vars): pass, confirms no circular-import breakage from the new
  `notify`/template imports in `user.controller.js` and
  `group.controller.js`.
- `npm run build` (client): pass.
- `npx eslint .` (client): zero errors, zero warnings.
