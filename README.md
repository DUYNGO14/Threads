# DThreads

A full-stack social media platform inspired by Threads/Twitter, built with the MERN stack, real-time messaging, content moderation, and an admin dashboard.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue) ![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-black) ![Redis](https://img.shields.io/badge/Cache-Redis-red) ![BullMQ](https://img.shields.io/badge/Queue-BullMQ-orange)

---

## Features

**Authentication & Users**
- Email/password signup with OTP email verification
- Login with Google and Facebook (OAuth 2.0)
- JWT-based authentication with refresh tokens
- Forgot/reset password via email
- Follow/unfollow users, user search and suggestions
- Freeze or delete account
- Profile with bio, avatar, date of birth, social links
- Verified badge support

**Posts & Content**
- Create posts with text (max 500 chars) and up to 10 media files (images, videos, audio)
- Like/unlike, repost, reply/comment on posts
- Tag friends in posts
- Personalized feed with recommendation engine
- Post moderation pipeline: `pending → approved / rejected`
- Automatic content moderation via Sightengine (text + media)
- Trending and explore feeds

**Messaging**
- One-on-one and group conversations
- Real-time delivery via Socket.io
- Media support in messages (images, videos, audio, GIFs)
- Message seen/unseen status
- System messages (join, leave, kick, rename group)
- Soft-delete conversations per user

**Notifications**
- Real-time notifications: like, reply, follow, tag, repost, message, report, system
- Mark all as read, delete individual notifications
- Unread count badge

**Admin Dashboard** (`/admin`)
- User management: view all users, block/unblock
- Post moderation: approve, reject, or process posts
- Report management: view, update status, delete
- Analytics charts: registered users by week, posts by week, posts by status, report stats by month/year, growth metrics
- BullMQ queue monitor at `/admin/queues/`

**Reporting**
- Report users, posts, or comments with a reason
- Status workflow: `pending → reviewed → resolved`
- Rate-limited to prevent abuse

**Infrastructure**
- Redis (Upstash) caching for feeds and suggestions
- BullMQ background job queues: notifications, emails, moderation, user interactions
- Cron jobs: delete unverified users daily, refresh feeds every 30 min, server keep-alive ping
- Rate limiting on auth, post creation, messaging, group creation, and reports
- Cloudinary for media storage (images, videos, audio)
- SendGrid for transactional emails
- FFmpeg for video processing

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, Chakra UI, Recoil, React Router v7, Framer Motion |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Realtime | Socket.io |
| Queue | BullMQ, Bull Board |
| Cache | Redis (Upstash) |
| Auth | JWT, Passport.js (Google, Facebook OAuth) |
| Storage | Cloudinary |
| Email | SendGrid |
| Moderation | Sightengine |
| Media | FFmpeg, Multer |

---

## Project Structure

```
├── backend/
│   ├── config/          # DB, Redis, Cloudinary, Email, Passport
│   ├── controllers/     # Route handlers
│   ├── middlewares/     # Auth, rate limiting, file upload, error handling
│   ├── models/          # Mongoose schemas
│   ├── queues/          # BullMQ producers + Bull Board
│   ├── routes/          # API route definitions
│   ├── services/        # Feed, recommendation, notification services
│   ├── sockets/         # Socket.io event handlers
│   ├── utils/           # Helpers and utilities
│   ├── workers/         # BullMQ consumers
│   ├── cron/            # Scheduled jobs
│   └── server.js        # Entry point
└── frontend/
    └── src/
        ├── atoms/       # Recoil state (auth, posts, messages, notifications)
        ├── components/  # Reusable UI components
        ├── layouts/     # MainLayout, ChatLayout, AdminLayout, BaseLayout
        └── pages/       # Page components
```

---

## Setup

### Prerequisites

- Node.js >= 18
- MongoDB instance
- Upstash Redis account
- Cloudinary account
- SendGrid account
- Google and/or Facebook OAuth app credentials
- Sightengine account (for content moderation)

### Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGO_URI=

# JWT & Session
JWT_SECRET=
SESSION_SECRET=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_REDIS_HOST=
UPSTASH_REDIS_PORT=
UPSTASH_REDIS_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SendGrid
SENDGRID_API_KEY=
FROM_EMAIL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# Sightengine (content moderation)
SIGHTENGINE_USER_ID=
SIGHTENGINE_API_KEY=
```

---

## Running the App

### Development

```bash
# Install all dependencies (backend + frontend)
npm install
npm install --prefix frontend

# Start backend (with nodemon, port 5000)
npm run dev

# In a separate terminal, start frontend (port 3000)
cd frontend
npm run dev
```

### Production

```bash
# Build frontend and install all dependencies
npm run build

# Start production server
npm start
```

---

## API Routes

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register with email |
| POST | `/login` | Login |
| POST | `/logout` | Logout |
| GET | `/me` | Get current user |
| GET | `/refresh-token` | Refresh JWT |
| POST | `/verify-account` | Verify email with OTP |
| POST | `/resend-otp` | Resend OTP |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password/:token` | Reset password |
| PUT | `/change-password` | Change password (auth required) |
| GET | `/google` | Google OAuth |
| GET | `/facebook` | Facebook OAuth |

### Users — `/api/users`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile/me` | Current user profile |
| GET | `/profile/:query` | Get profile by username or ID |
| GET | `/suggested` | Suggested users |
| GET | `/search` | Search users |
| POST | `/follow/:id` | Follow / unfollow |
| PUT | `/update/:id` | Update profile |
| PUT | `/freeze` | Freeze account |
| POST | `/delete` | Delete account |

### Posts — `/api/posts`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/create` | Create post (with media) |
| GET | `/feed` | Personalized feed |
| GET | `/followed` | Posts from followed users |
| GET | `/recommended` | Recommended posts |
| GET | `/user/:username` | User's posts |
| GET | `/:id` | Single post |
| DELETE | `/:id` | Delete post |
| PUT | `/like/:id` | Like / unlike |
| PUT | `/repost/:id` | Repost |
| PUT | `/:postId/update` | Update post |

### Messages — `/api/messages`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get messages |
| POST | `/` | Send message (with media) |
| PUT | `/:messageId` | Edit message |
| DELETE | `/:messageId` | Delete message |

### Conversations — `/api/conversations`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all conversations |
| POST | `/initiate` | Start 1-on-1 conversation |
| POST | `/group` | Create group |
| PUT | `/group/add-member/:id` | Add members to group |
| PUT | `/group/remove-member/:id` | Remove member |
| PUT | `/group/leave/:id` | Leave group |
| PUT | `/:id/rename` | Rename group |
| DELETE | `/delete/:id` | Delete conversation |
| DELETE | `/group/:id` | Delete group |

### Notifications — `/api/notifications`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get notifications |
| PATCH | `/mark-all-read` | Mark all as read |
| DELETE | `/delete/:id` | Delete notification |

### Reports — `/api/reports`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create report |
| GET | `/` | Get all reports (admin) |
| PUT | `/:id/status` | Update report status (admin) |
| DELETE | `/:id` | Delete report (admin) |

### Admin — `/api/admin`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | All users |
| PUT | `/user/:id/block` | Block / unblock user |
| PUT | `/post/:id/status` | Update post status |
| GET | `/statistics/users/registered` | User registration stats |
| GET | `/statistics/posts/created` | Post creation stats |
| GET | `/growth` | Growth metrics |
| GET | `/reports` | All reports |
| GET | `/posts` | Posts by status |

### Queue Dashboard
- `GET /admin/queues/` — Bull Board UI for monitoring background job queues

---

## Upload Limits

| Setting | Value |
|---|---|
| Max post text | 500 characters |
| Max files per post | 10 |
| Max file size | 50 MB |
| Supported images | jpg, jpeg, png, gif, webp |
| Supported videos | mp4, webm, mov |
| Supported audio | mp3, wav, ogg |

---

## Frontend Pages

| Route | Description |
|---|---|
| `/` | Home feed |
| `/auth` | Login / Signup |
| `/user/:username` | User profile |
| `/:username/post/:pid` | Single post |
| `/notifications` | Notifications |
| `/chat` | Messaging |
| `/search` | Search |
| `/update` | Edit profile |
| `/settings` | Account settings |
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/reports` | Report management |
| `/admin/posts` | Post moderation |
