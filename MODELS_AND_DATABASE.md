# Models & Database Configuration

Student–Supervisor Management System (SSMS)  
Stack: **MongoDB** + **Mongoose** · File storage: **Cloudinary**

---

## 1. Database configuration

### Connection

| Item | Value |
|------|--------|
| Driver | Mongoose |
| Config file | `server/config/db.js` |
| Entry point | `server/server.js` calls `connectDB()` before listening |
| Connection string | `process.env.MONGO_URI` |

```js
// server/config/db.js
await mongoose.connect(process.env.MONGO_URI);
```

On failure the process exits with code `1`.

### Environment variables

Copy `server/.env.example` to `server/.env` and fill in real values.

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | API server port | `5000` |
| `MONGO_URI` | MongoDB connection URI | `mongodb+srv://...@cluster.mongodb.net/student-supervisor` |
| `JWT_SECRET` | JWT signing secret | long random string |
| `CLIENT_URL` | Frontend origin (CORS) | `http://localhost:5174` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | from Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | from Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | from Cloudinary dashboard |

> Document **files** are stored on Cloudinary. MongoDB stores only metadata (`fileUrl`, `publicId`, etc.).

### Cloudinary config

File: `server/config/cloudinary.js`

- Uses `CLOUDINARY_*` env vars
- `secure: true`
- Warns on startup if any Cloudinary env var is missing (uploads will fail until configured)

---

## 2. Collections / models overview

| Model | Collection (default) | File |
|-------|----------------------|------|
| User | `users` | `server/models/User.js` |
| Department | `departments` | `server/models/Department.js` |
| Student | `students` | `server/models/Student.js` |
| Supervisor | `supervisors` | `server/models/Supervisor.js` |
| Group | `groups` | `server/models/Group.js` |
| Assignment | `assignments` | `server/models/Assignment.js` |
| Document | `documents` | `server/models/Document.js` |
| Task | `tasks` | `server/models/Task.js` |
| Meeting | `meetings` | `server/models/Meeting.js` |

All models use Mongoose `timestamps: true` (`createdAt`, `updatedAt`) unless noted otherwise.

---

## 3. Entity relationships

```
User (role: admin | supervisor | student) 
 ├── Student.user  → User
 ├── Supervisor.user → User
 └── Group.createdBy → User

Department
 ├── Student.department → Department
 ├── Supervisor.department → Department
 └── Group.department → Department

Supervisor
 ├── Student.supervisor → Supervisor
 ├── Group.supervisor → Supervisor
 ├── Assignment.supervisor → Supervisor
 ├── Document.reviewedBy → Supervisor
 ├── Task.assignedBy → Supervisor
 └── Meeting.createdBy → Supervisor

Student
 ├── Group.members[] → Student
 ├── Assignment.student → Student
 ├── Document.uploadedBy → Student
 ├── Task.assignedTo → Student
 └── Meeting.students[] → Student

Group
 ├── Document.group → Group
 ├── Task.group → Group
 └── Meeting.group → Group
```

---

## 4. Model schemas

### 4.1 User

Authentication account for all roles.

| Field | Type | Rules |
|-------|------|--------|
| `name` | String | required, trimmed |
| `email` | String | required, unique, lowercase, trimmed |
| `password` | String | required, min length 6 (stored hashed) |
| `role` | String | enum: `admin`, `supervisor`, `student` (default `student`) |
| `isActive` | Boolean | default `true` |
| `createdAt` / `updatedAt` | Date | auto |

---

### 4.2 Department

| Field | Type | Rules |
|-------|------|--------|
| `name` | String | required, unique, trimmed |
| `code` | String | required, unique, uppercase, trimmed |
| `description` | String | optional, trimmed |
| `isActive` | Boolean | default `true` |
| `createdAt` / `updatedAt` | Date | auto |

---

### 4.3 Student

Profile linked 1:1 to a User with role `student`.

| Field | Type | Rules |
|-------|------|--------|
| `user` | ObjectId → User | required, unique |
| `studentId` | String | required, unique, trimmed |
| `department` | ObjectId → Department | required |
| `supervisor` | ObjectId → Supervisor | optional, default `null` |
| `phone` | String | default `""` |
| `level` | String | default `""` |
| `academicYear` | String | default `""` |
| `createdAt` / `updatedAt` | Date | auto |

---

### 4.4 Supervisor

Profile linked 1:1 to a User with role `supervisor`.

| Field | Type | Rules |
|-------|------|--------|
| `user` | ObjectId → User | required, unique |
| `employeeId` | String | required, unique, trimmed |
| `department` | ObjectId → Department | required |
| `specialization` | String | default `""` |
| `phone` | String | default `""` |
| `maxStudents` | Number | default `10`, min `1` |
| `createdAt` / `updatedAt` | Date | auto |

---

### 4.5 Group

Student project / collaboration group.

| Field | Type | Rules |
|-------|------|--------|
| `name` | String | required, trimmed |
| `code` | String | required, unique, uppercase, trimmed |
| `department` | ObjectId → Department | required |
| `supervisor` | ObjectId → Supervisor | optional, default `null` |
| `members` | [ObjectId → Student] | array |
| `status` | String | enum: `active`, `inactive`, `archived` (default `active`) |
| `projectTitle` | String | default `""` |
| `description` | String | default `""` |
| `createdBy` | ObjectId → User | required |
| `createdAt` / `updatedAt` | Date | auto |

**Indexes**

- `{ department: 1, status: 1 }`
- `{ supervisor: 1, status: 1 }`
- `{ members: 1, status: 1 }`

---

### 4.6 Assignment

Links a student to a supervisor (assignment history).

| Field | Type | Rules |
|-------|------|--------|
| `student` | ObjectId → Student | required |
| `supervisor` | ObjectId → Supervisor | required |
| `assignedBy` | ObjectId → User | required (usually admin) |
| `assignedAt` | Date | default `Date.now` |
| `status` | String | enum: `active`, `completed`, `cancelled` (default `active`) |
| `notes` | String | default `""` |
| `createdAt` / `updatedAt` | Date | auto |

**Indexes**

- Unique on `{ student: 1 }` **only when** `status: "active"`  
  (one active assignment per student; cancelled/completed history is kept)

---

### 4.7 Document

Student submission metadata. Binary files live on Cloudinary.

| Field | Type | Rules |
|-------|------|--------|
| `title` | String | required, trimmed |
| `type` | String | enum: `thesis`, `project_book`, `proposal`, `report`, `other` |
| `fileName` | String | required (Cloudinary-side / storage name) |
| `originalName` | String | required (original upload name) |
| `fileUrl` | String | required (Cloudinary `secure_url`) |
| `publicId` | String | required (for delete/replace) |
| `fileType` | String | MIME / type hint, default `""` |
| `mimeType` | String | default `""` |
| `fileSize` | Number | default `0` |
| `resourceType` | String | Cloudinary: `image` \| `raw` \| `video` (default `raw`) |
| `uploadedBy` | ObjectId → Student | required |
| `group` | ObjectId → Group | optional |
| `status` | String | enum: `pending_review`, `approved`, `rejected`, `changes_requested` (default `pending_review`) |
| `feedback` | String | supervisor notes, default `""` |
| `reviewedBy` | ObjectId → Supervisor | optional |
| `reviewedAt` | Date | optional |
| `uploadedAt` | Date | default `Date.now` |
| `createdAt` / `updatedAt` | Date | auto |

**Virtuals**

| Virtual | Maps to |
|---------|---------|
| `documentType` | `type` |
| `student` | `uploadedBy` |
| `supervisor` | `reviewedBy` |

**Indexes**

- `{ uploadedBy: 1, createdAt: -1 }`
- `{ status: 1, createdAt: -1 }`
- `{ group: 1 }`
- `{ publicId: 1 }`

---

### 4.8 Task

Supervisor-assigned work for a student.

| Field | Type | Rules |
|-------|------|--------|
| `title` | String | required, trimmed |
| `description` | String | default `""` |
| `dueDate` | Date | required |
| `assignedTo` | ObjectId → Student | required |
| `group` | ObjectId → Group | optional |
| `assignedBy` | ObjectId → Supervisor | required |
| `priority` | String | enum: `low`, `medium`, `high` (default `medium`) |
| `status` | String | enum: `pending`, `in_progress`, `completed` (default `pending`) |
| `submissionNote` | String | default `""` |
| `submittedAt` | Date | optional |
| `createdAt` / `updatedAt` | Date | auto |

**Indexes**

- `{ assignedTo: 1, dueDate: 1 }`
- `{ assignedBy: 1, status: 1 }`

---

### 4.9 Meeting

Scheduled meeting between supervisor and student(s) / group.

| Field | Type | Rules |
|-------|------|--------|
| `title` | String | required, trimmed |
| `description` | String | default `""` |
| `date` | Date | required |
| `time` | String | required, trimmed |
| `location` | String | default `""` |
| `meetingLink` | String | default `""` |
| `group` | ObjectId → Group | optional |
| `students` | [ObjectId → Student] | array |
| `createdBy` | ObjectId → Supervisor | required |
| `status` | String | enum: `scheduled`, `completed`, `cancelled` (default `scheduled`) |
| `createdAt` / `updatedAt` | Date | auto |

**Indexes**

- `{ createdBy: 1, date: 1 }`
- `{ students: 1, date: 1 }`
- `{ group: 1 }`

---

## 5. Status & enum cheat sheet

| Model | Field | Values |
|-------|-------|--------|
| User | `role` | `admin`, `supervisor`, `student` |
| Group | `status` | `active`, `inactive`, `archived` |
| Assignment | `status` | `active`, `completed`, `cancelled` |
| Document | `type` | `thesis`, `project_book`, `proposal`, `report`, `other` |
| Document | `status` | `pending_review`, `approved`, `rejected`, `changes_requested` |
| Task | `priority` | `low`, `medium`, `high` |
| Task | `status` | `pending`, `in_progress`, `completed` |
| Meeting | `status` | `scheduled`, `completed`, `cancelled` |

---

## 6. Quick start (local)

1. Ensure MongoDB Atlas (or local MongoDB) is reachable.
2. Create `server/.env` from `server/.env.example`.
3. From `server/`:

```bash
npm install
npm run create-admin   # if available — seeds an admin user
npm run dev
```

4. API listens on `PORT` (default `5000`). Confirm console: `MongoDB connected successfully`.

---

## 7. Source paths

```
server/
├── config/
│   ├── db.js              # MongoDB connection
│   └── cloudinary.js      # Cloudinary SDK config
├── models/
│   ├── User.js
│   ├── Department.js
│   ├── Student.js
│   ├── Supervisor.js
│   ├── Group.js
│   ├── Assignment.js
│   ├── Document.js
│   ├── Task.js
│   └── Meeting.js
├── .env.example
└── server.js              # loads dotenv + connectDB()
```
