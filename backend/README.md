# CyberThulir — Cybersecurity Learning Platform

## Stack

### Backend
- Node.js
- Express
- PostgreSQL
- Docker
- Prisma ORM
- JWT
- bcryptjs
- Nodemailer

### Frontend
- Next.js / React
- TypeScript

---

# Run

## Backend

```bash
npm install
npm start
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:10300
```

---

# Database

PostgreSQL is used as the database and runs through Docker.

Current development configuration:

```text
Host: 127.0.0.1
Port: 5433
Database: cybersecurity_db
Container: cybersecurity-postgres
```

PostgreSQL remains the database; Prisma is the database access layer for the non-Admin backend.

---

# Learn Path (MongoDB)

Learn-path progress (topic stages, XP, levels, stars, streaks, reward chests) is stored in MongoDB, which runs in Docker next to PostgreSQL.

## Run

```bash
cd backend
docker compose up -d          # PostgreSQL + MongoDB
npm start
```

```text
Host: 127.0.0.1
Port: 27017
Database: cyberthulir_learn
Container: cybersecurity-mongo
```

The backend connects as `MONGO_APP_USER`, which only has `readWrite` on `MONGO_DB`. `docker/mongo-init/01-create-app-user.js` creates it the first time the `mongo_data` volume is created; the root account is for administration only. Settings are in `.env` (see `.env.example`). The server exits at startup if MongoDB is unreachable.

## How it works

```text
learn/curriculum.js             modules, topics, stages, rewards (source of truth)
services/learnProgressService.js  unlock rules, XP, levels, stars, streaks
controllers/learnController.js
routes/learnRoutes.js           /api/learn (signed-in learners only)
```

- Every topic has five stages, done in order: `story → concept → visualize → game → done`.
- A topic unlocks when the topic before it is done, so finishing a module's last topic opens the next module.
- Rewards: 8 XP per stage, 40 XP per topic (60 for capstones), 10 XP per chest, 100 XP per module cleared, 250 XP for the course.
- Level = XP / 250 + 1; ranks run from Packet Scout to Network Guardian (LV 16).
- Stars per module (0–3) follow module progress. The daily streak uses the learner's local day (the browser sends its timezone offset).
- Each write is one conditional MongoDB update, so double clicks and replayed requests never award XP twice.

## Collections

```text
learn_profiles   one document per account: xp, streak, per-course topic stages, chests, cleared modules
learn_events     log of every reward (expires after 1 year)
```

## API

```text
GET  /api/learn/me                                            XP, level, streak (top bar)
GET  /api/learn/courses/networking                            whole path + progress
POST /api/learn/courses/networking/topics/:topicId/stages/:stage   e.g. /topics/1-1/stages/story
POST /api/learn/courses/networking/chests/:chestId            e.g. /chests/chest-1-2
POST /api/learn/courses/networking/reset                      restart the course (removes its progress and XP)
```

Errors: `401` not signed in, `403` topic or chest still locked, `404` unknown course/topic/stage, `409` an earlier stage isn't done yet.

---

# Certifications (MongoDB)

```text
certifications/tracks.js            tracks and their requirements (source of truth)
services/certificateService.js      progress, claiming, serials, verification
utils/certificatePdf.js             dependency-free PDF renderer
controllers/certificateController.js
routes/certificateRoutes.js         /api/certificates
```

- Requirements point at real progress: every topic of a learn-path module, a completed lab (flag accepted), or another certificate. Progress is recomputed on every request, never stored.
- A learner claims a track once every requirement is met; the server re-checks, then issues a serial like `CCSF-4KQ2-8XF1-9MT3`. Claiming is idempotent (one certificate per account per track, enforced by a unique index).
- Holder name and track title are copied in at issue time, so a certificate never changes afterwards. Resetting a course does not remove issued certificates.
- Tracks with `status: "coming_soon"` are listed but can't be claimed. Add content, then add requirements and switch them to `available`. `validateTracks()` fails at startup if a requirement points at a missing module or lab.

```text
GET  /api/certificates                         tracks + progress (signed in)
POST /api/certificates/tracks/:code/claim      { name? } issue the certificate
GET  /api/certificates/:serial/pdf             owner's PDF download
GET  /api/certificates/verify/:serial          public verification (rate limited)
```

Frontend: `/certificates` (signed in) and `/verify?serial=...` (public).

---

# Community (MongoDB)

```text
services/communityService.js        posts, comments, likes, reports, highlights, moderation
controllers/communityController.js
routes/communityRoutes.js           /api/community (signed-in members only)
```

Collections: `community_posts`, `community_comments`, `community_likes`, `community_reports`.

- Post kinds: `writeup`, `question`, `announcement` (announcements: staff, recruiters and faculty only).
- Likes and reports have one document per (target, account), so double clicks never count twice.
- 5 open reports from different members hide a post/comment until a moderator reviews it; its author still sees it.
- Author names are looked up at read time (usernames can change); deleted accounts show as `deleted-account`.
- Bodies are plain text (``` fences render as code); the frontend never renders HTML from posts.
- Cursor pagination (15 posts / 50 comments), text search, tag filter, latest/most-liked sort.

```text
GET    /api/community/posts?kind=&tag=&q=&sort=latest|top&mine=1&cursor=
POST   /api/community/posts                     { kind, title, body, tags: "sqli, jwt" }
GET    /api/community/posts/:id
PUT    /api/community/posts/:id                 author only
DELETE /api/community/posts/:id                 author only (soft delete)
POST   /api/community/posts/:id/like            DELETE to unlike
POST   /api/community/posts/:id/report          { reason, details? }
GET    /api/community/posts/:id/comments?cursor=
POST   /api/community/posts/:id/comments        { body }
PUT    /api/community/comments/:id              author only
DELETE /api/community/comments/:id              author only
POST   /api/community/comments/:id/report       { reason, details? }
GET    /api/community/highlights                trending tags, top contributors, my stats
```

## Admin moderation (Bearer admin token)

```text
GET  /api/admin/community/queue                       reported posts and comments
POST /api/admin/community/posts/:id/moderate          { action: remove|restore|dismiss|pin|unpin }
POST /api/admin/community/comments/:id/moderate       { action: remove|restore|dismiss }
POST /api/admin/community/announcements               { title, body, tags, pinned: "true"? }
GET  /api/admin/certificates?status=&track=&q=&page=
POST /api/admin/certificates/:serial/revoke           { reason }
POST /api/admin/certificates/:serial/reinstate
```

---

# Groups & chat (MongoDB + Server-Sent Events)

```text
services/chatService.js       groups, channels, DMs, messages, reactions, roles, bans
services/realtime.js          live delivery over SSE (Redis pub/sub when REDIS_URL is set)
controllers/chatController.js
routes/chatRoutes.js          /api/chat (signed-in members only)
```

Frontend: `/community/chat` (invite links: `/community/chat?invite=<code>`).

- Groups are public (discoverable) or private (invite link only); each starts with `#general`.
- Roles: owner > moderator > member. Moderators manage channels, invites, kicks and bans; the owner also manages roles, visibility and ownership transfer, and can delete the group.
- Messages: replies, 8 fixed reactions, `@mentions`, ``` code blocks, edit/delete (moderators can delete any message in their group), shared community posts.
- Direct messages between any two members by username; either side can block.
- Unread counts per channel/DM, typing indicators, online presence.
- Members are shown by `uid` (a one-way hash), never by account id.
- Limits: 10 owned / 100 joined groups per account, 2000 members and 30 channels per group, 2000-character messages, plus per-account rate limits.

Collections: `chat_groups`, `chat_members`, `chat_bans`, `chat_channels`, `chat_dms`, `chat_messages`, `chat_reads`, `chat_blocks`.

Running several backend instances: set `REDIS_URL` so events reach users connected to any instance. Online status is per instance. Reverse proxies must not buffer `/api/chat/stream` (the response sets `X-Accel-Buffering: no` for nginx) and need a read timeout above 30 s (the stream sends a heartbeat every 25 s).

---

# Prisma ORM

## Why Prisma was used

The backend previously used both raw PostgreSQL (`pg`) and Prisma.

it is converted to Prisma to use a consistent database access layer and avoid maintaining two different database access methods.

### Architecture

```text
    Backend
       ↓
   Prisma ORM
       ↓
   PostgreSQL
```

## Important Prisma Files

```text
backend/prisma/
├── contract.prisma
├── contract.json
└── db.mjs

backend/prisma.config.ts
backend/migrations/app/
```

Important models:

```text
Admins
AdminEmailVerificationTokens
Colleges
EmailVerificationTokens
LoginOtps
Organisation
PasswordResetTokens
Professionals
UserProfiles
Users
LabProgress
```

---

# Completed Prisma Conversion

The following non-Admin modules were converted from raw PostgreSQL queries to Prisma:

### Services
```text
services/accountService.js
services/loginOtpService.js
services/cleanupService.js
services/labProgressService.js
```

### Authentication
```text
controllers/auth/signupController.js
controllers/auth/loginController.js
controllers/auth/verifyLoginOtpController.js
controllers/auth/resendLoginOtpController.js
controllers/auth/verifyEmailController.js
controllers/auth/forgotpass.js
controllers/auth/resetPassword.js
```

### Middleware
```text
Middleware/authMiddleware.js
```

### User Management
```text
controllers/user/userController.js
controllers/user/emailChangeController.js
```

### College Management
```text
controllers/collegeController.js
database/collegeDB.js
```

Existing authentication behavior, validation, transactions, concurrency handling and session security were preserved.

---

# Authentication

## Signup

```text
Signup
  ↓
Validate input
  ↓
Check duplicate account
  ↓
Hash password
  ↓
Create account using Prisma
  ↓
Create verification token
  ↓
Send email
```

## Login

```text
Login
  ↓
Verify password
  ↓
Create OTP challenge
  ↓
Send OTP
  ↓
Verify OTP
  ↓
Create authenticated session
```

## Session Security

JWT is stored in an httpOnly cookie:

```text
ct_session
```

Non-GET browser requests require:

```text
X-CSRF-Protection: 1
```

Existing sessions are revoked when required, including logout and password changes/resets.

---

# Password Reset

```text
Forgot Password
      ↓
Email Link
      ↓
Reset Password
      ↓
Existing Sessions Revoked
```

---

# User Management

The user module supports:

- Profile retrieval
- Profile updates
- Password changes
- Email changes
- Email-change verification
- Session/token invalidation

Models include:

```text
Users
Organisation
Professionals
UserProfiles
```

---

# Lab Progress

`services/labProgressService.js` was converted to Prisma.

It handles:

- Starting labs
- Getting progress
- Listing progress
- Lab state
- Hints and penalties
- Attempts
- Scores
- Completion status

`LabProgress` uses:

```text
accountId
accountType
labSlug
```

Atomic operations were preserved for concurrent updates.

---

# College Management

## Backend

```text
GET /api/colleges
```

The college controller retrieves colleges from PostgreSQL using Prisma.

`database/collegeDB.js` initializes missing colleges using Prisma and handles duplicate/concurrent initialization.

## Frontend

The signup college dropdown now fetches colleges from:

```text
GET /api/colleges
```

Flow:

```text
Signup Screen
     ↓
/api/colleges
     ↓
College Controller
     ↓
Prisma
     ↓
PostgreSQL
```

The frontend includes:
- Loading state
- API response validation
- Fallback handling
- `Other` option

---

# Raw SQL Verification

A final backend scan checked for raw database access such as:

```text
pool.query()
client.query()
require("pg")
$queryRaw
$executeRaw
```

# Migrations

There are two migration areas:

### Existing SQL migrations

```text
backend/database/migrations/
```

These are kept separately and should not be deleted without checking their database/deployment role.

### Prisma migrations

```text
backend/migrations/app/
```

These are the Prisma application migrations.

The Prisma database contract was verified successfully against the database.

---

# Main API Routes

## Authentication

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/verify-login-otp
POST /api/auth/resend-login-otp
GET  /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/logout
```

## User

```text
GET /api/user/profile
PUT /api/user/profile
PUT /api/user/change-password
```

## Colleges

```text
GET /api/colleges
```

## Labs

```text
GET /api/labs
GET /api/labs/:slug/meta
POST /api/labs/:slug/hints/:index
POST /api/labs/:slug/submit
POST /api/labs/:slug/reset
```

---

# Verification

The following were verified after the changes:

### Prisma

```bash
npx prisma db verify
```

Result:

```text
Database marker and schema match contract
```

### Frontend

```bash
npx tsc --noEmit
```

Result:

```text
0 errors
```

### College API

```text
GET /api/colleges
```

Result:

```text
200 OK
```

### Raw SQL Scan

```text
Non-Admin raw database access: 0
```

Converted modules were also tested for authentication, user management, cleanup, lab progress and college functionality.

---

# Key Project Changes

1. Converted non-Admin raw PostgreSQL database access to Prisma ORM.
2. Kept PostgreSQL as the database.
3. Converted authentication, user, OTP, cleanup, lab-progress and college modules.
4. Preserved existing API behavior and security logic.
5. Verified the Prisma contract against the database.
6. Confirmed zero non-Admin raw SQL database-access occurrences.
7. Kept Admin raw PostgreSQL implementation unchanged.
8. Updated the signup college dropdown to load data from the backend.
9. Verified the college API and frontend TypeScript compilation.
10. Kept existing SQL migration files separately from Prisma migrations.
