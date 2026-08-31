# Student Supervisor System

A web-based management platform that replaces fragmented communication channels with a structured **submission → review → feedback** workflow across three roles: **Admin**, **Supervisor**, and **Student**.

Built with the **MERN stack** and **Cloudinary** for secure, direct-to-cloud file storage.

---

## Team

- Mohamed Abdirahman Muse
- Xanaan Abdirahman Mohamud
- Najma Abdikadir Muse
- Mohamed Mahdi Abdikarim
- Abdullahi Ahmed Jimcaale
- Nasro Hassan Mohamed

---

## Tech Stack

| Layer            | Technology                         |
| ---------------- | ---------------------------------- |
| Frontend         | React (Vite) + Tailwind CSS        |
| State Management | Redux Toolkit                      |
| Backend          | Node.js + Express.js               |
| Database         | MongoDB (Atlas) via Mongoose       |
| File Storage     | Cloudinary (signed direct uploads) |
| Auth             | JWT (Access + Refresh Tokens)      |
| Email            | Resend / SendGrid / AWS SES        |
| Hosting          | Vercel / Render / Railway          |

---

## System Roles

| Role           | Description                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Admin**      | Manages accounts, creates cohort groups, assigns students to supervisors, monitors global activity, configures settings |
| **Supervisor** | Publishes milestone guidelines, reviews submissions, approves or requests changes, tracks student progress              |
| **Student**    | Views assigned supervisor, reviews guidelines, submits work per milestone, tracks feedback, resubmits versions          |

---

## Project Structure

```
student-supervisor-system/
├── server/                  # Express API
│   ├── src/
│   │   ├── models/          # User, Group, Milestone, Submission, Notification, AuditLog
│   │   ├── routes/          # auth, users, groups, milestones, submissions, uploads, notifications, audit
│   │   ├── controllers/     # matching *.controller.js per route
│   │   ├── middleware/      # auth, role guards, error handling
│   │   ├── config/          # db.js, cloudinary.js
│   │   ├── utils/           # sendEmail.js, generateToken.js
│   │   ├── app.js
│   │   └── server.js
│   └── .env
│
├── client/                  # React (Vite) frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── supervisor/
│   │   │   ├── student/
│   │   │   └── auth/
│   │   ├── components/      # shared UI
│   │   ├── store/           # Redux Toolkit store + slices
│   │   ├── hooks/           # useAuth, useCloudinaryUpload
│   │   ├── services/        # axios instance + API calls
│   │   └── utils/
│   └── .env
│
└── package.json             # root scripts (concurrently runs client + server)
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (20 LTS recommended)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Git

### Installation

```bash
git clone https://github.com/<your-org>/student-supervisor-system.git
cd student-supervisor-system

# install root, server, and client dependencies
npm install
npm install --prefix server
npm install --prefix client
```

### Environment Variables

**`server/.env`**

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/student-supervisor
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_PROVIDER_API_KEY=your_resend_or_sendgrid_key
CLIENT_URL=http://localhost:5173
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

> Never commit `.env` files. Both are already listed in `.gitignore`.

### Run in Development

```bash
npm run dev
```

This runs the Express API (`localhost:5000`) and the Vite dev server (`localhost:5173`) concurrently.

---

## File Upload Flow (Cloudinary)

Files are uploaded **directly from the browser to Cloudinary** — they never pass through the Express server:

1. Client requests a signed upload signature from `POST /api/uploads/signature`
2. Server signs the request using the Cloudinary API secret (never exposed to the client)
3. Client uploads the file directly to Cloudinary's REST API
4. Cloudinary returns `public_id`, `secure_url`, `format`, `bytes`
5. Client sends that metadata (not the file) to the backend to persist in MongoDB

---

## Core Workflow

1. **User Provisioning** — Admin creates accounts, forms groups, assigns students to supervisors
2. **Milestone Publishing** — Supervisor publishes guidelines/tasks per milestone
3. **Submission** — Student uploads work against a milestone
4. **Review** — Supervisor approves or requests changes with feedback
5. **Iteration** — Student resubmits, preserving full version history
6. **Oversight** — Admin monitors aggregate progress via dashboard

---

## Branching & Contribution Workflow

`main` is protected — no direct pushes. All changes go through a pull request with at least 1 approval.

```bash
git checkout -b feat/short-description
# ...make changes...
git add .
git commit -m "feat: short description"
git push origin feat/short-description
```

Then open a pull request on GitHub targeting `main` and request a review.

**Branch naming convention:**

- `feat/...` — new features
- `fix/...` — bug fixes
- `chore/...` — tooling, config, docs

---

## Scripts

| Command       | Description                      |
| ------------- | -------------------------------- |
| `npm run dev` | Run client + server concurrently |
| `npm run dev` | Run frontend only (Vite)         |

---

## License

This project is for academic purposes as part of a university coursework submission.
