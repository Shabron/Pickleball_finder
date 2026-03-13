# Senior Pickleball Partner Finder

## Complete Project Plan — Business, Product & Technical

---

# Part 1: Business Plan

## 1.1 Executive Summary

**Senior Pickleball Partner Finder** is a mobile application (Android & iOS) designed to help senior pickleball enthusiasts (ages 50+) find compatible playing partners in their area. Pickleball is the fastest-growing sport in the United States, with a massive senior demographic. This app solves the real pain point of finding partners who match your schedule, skill level, location, and play style — something social media groups and community boards do poorly.

The app is free to download and use, with a path to monetization through premium features, local advertising, and event sponsorships.

## 1.2 Problem Statement

- Senior pickleball players struggle to find partners at their skill level nearby
- Existing solutions (Facebook groups, community boards) are fragmented and not purpose-built
- Scheduling is difficult — players have varying availability and preferences
- No existing app caters specifically to the senior pickleball demographic

## 1.3 Target Audience

| Segment | Description |
|---|---|
| **Primary** | Adults aged 50+ who play or want to learn pickleball |
| **Secondary** | Recreational centers, senior communities, pickleball clubs |
| **Tertiary** | Local coaches looking for students |

### User Personas

**1. "Active Retiree" — Martha, 67**
- Retired teacher, plays pickleball 3x/week
- Moved to a new state and doesn't know anyone
- Wants to find doubles partners at an intermediate level
- Prefers morning games

**2. "New Player" — Robert, 58**
- Just discovered pickleball at his community center
- Beginner skill level, looking for patient partners
- Wants to play on weekends
- Interested in both singles and doubles

**3. "Competitive Senior" — Linda, 62**
- Advanced player, competes in local tournaments
- Looking for strong practice partners
- Willing to travel within her state
- Wants regular scheduled matches

## 1.4 Market Opportunity

- **36.5 million** pickleball players in the US (2024, APP)
- **60%+** of core players are aged 55+
- Sport is growing at **~20% year-over-year**
- No dominant "find a partner" app exists in this space
- Senior smartphone adoption continues to rise

## 1.5 Revenue Model (Future Phases)

| Revenue Stream | Description | Timeline |
|---|---|---|
| **Freemium** | Free core features; premium for unlimited matches, advanced filters, priority listing | Phase 2 |
| **Local Advertising** | Promoted posts from local courts, shops, coaches | Phase 2 |
| **Event Sponsorship** | Partner with local tournaments for in-app promotion | Phase 3 |
| **Pro Accounts** | Coaches/clubs can create verified profiles and list services | Phase 3 |

> **Phase 1 (MVP) is entirely free** — focus is on user acquisition and engagement.

## 1.6 Competitive Landscape

| Competitor | Weakness |
|---|---|
| Facebook Groups | Not purpose-built; hard to search/filter; no matchmaking |
| Meetup | Generic; not sport-specific; no skill-level matching |
| Playtime Scheduler | Limited to scheduling; no social/matching features |
| Dupr | Focused on ratings, not partner finding |

**Our Edge**: Purpose-built for senior pickleball players with smart matchmaking, simple UX, and community focus.

## 1.7 Go-To-Market Strategy

1. **Soft Launch** — Target 3-5 states with highest pickleball participation (Florida, Arizona, California, Texas, North Carolina)
2. **Community Partnerships** — Partner with senior centers and pickleball clubs for promotion
3. **Social Media** — Targeted Facebook/Instagram ads in 50+ demographics
4. **Word of Mouth** — In-app referral system ("Invite a Partner")
5. **Content Marketing** — Blog/tips section on pickleball for seniors

## 1.8 Key Metrics (KPIs)

| Metric | Target (6 months) |
|---|---|
| Downloads | 10,000 |
| Monthly Active Users | 3,000 |
| Match Success Rate | 40%+ |
| Avg. Messages per Match | 5+ |
| User Retention (30-day) | 35% |

---

# Part 2: Product Specification

## 2.1 Product Overview

A mobile app where senior pickleball players can:
- Create a profile with their location, skill level, and availability
- Post what kind of partner they're looking for
- Get matched with compatible players via smart suggestions
- Message matched partners in real-time
- Receive push notifications for matches and messages

## 2.2 User Flows

### Flow 1: Onboarding → First Match

```
Download App → Splash Screen → Sign Up (name, email, password, phone)
→ Create Profile (state, city, skill level, availability, play style)
→ Home Feed (see posts filtered by your state)
→ View Post → Send Match Request
→ Partner Accepts → Chat Opens → Schedule a Game!
```

### Flow 2: Creating a Post

```
Home → Tap "+" Create Post
→ Fill in: Title, Description, State (dropdown), City, Skill Level, Play Style, Preferred Times
→ Submit → Post appears in feed
→ Receive match requests from interested players
→ Accept/Decline → Chat with accepted partners
```

### Flow 3: Getting Matched (Algorithmic)

```
Home → Tap "Find Partners" (Matches tab)
→ App shows suggested partners (scored by compatibility)
→ View Partner Profile → Send Match Request
→ Partner Accepts → Chat Opens
```

## 2.3 Feature Specification

### F1: Authentication
| Attribute | Detail |
|---|---|
| Sign Up | Name, email, password, phone number |
| Login | Email + password |
| Security | JWT tokens (access + refresh) |
| Forgot Password | Email-based reset (future: OTP) |

### F2: User Profile
| Attribute | Detail |
|---|---|
| Fields | Name, avatar, bio, skill level, age range, state, city, zip code, availability slots, play style |
| Skill Levels | Beginner, Intermediate, Advanced |
| Play Styles | Singles, Doubles, Both |
| Availability | Multi-select: Mon AM, Mon PM, Tue AM, ... Sun PM |
| State | Dropdown of all 50 US states |
| Actions | Create on first login, edit anytime |

### F3: Posts (Partner Search)
| Attribute | Detail |
|---|---|
| Fields | Title, description, state, city, desired skill level, play style, preferred times |
| Status | Open (active) / Closed (filled) |
| Filters | By state (dropdown), skill level, play style |
| Actions | Create, edit, delete own posts; view all open posts |

### F4: Matchmaking
| Attribute | Detail |
|---|---|
| Match Request | Send from a post or from suggested partners |
| Match Status | Pending → Accepted / Declined |
| Algorithm | Weighted scoring (see §3.4) |
| Suggestions | Shown in "Matches" tab, sorted by compatibility score |

### F5: Messaging
| Attribute | Detail |
|---|---|
| Availability | Only between matched (accepted) users |
| Type | Real-time (Socket.IO) with REST fallback |
| Features | Text messages, read receipts, typing indicator |
| Conversations | Listed in "Chat" tab with last message preview |

### F6: Notifications
| Attribute | Detail |
|---|---|
| Provider | Firebase Cloud Messaging (free) |
| Triggers | New match request, match accepted, new message, new post in your state |
| In-App | Notification history screen |

### F7: About Page
| Attribute | Detail |
|---|---|
| Content | App mission, how it works, team info, contact |
| Source | Served from backend API (easily updatable) |

## 2.4 Screen Map

```
App
├── Auth Stack
│   ├── Splash / Onboarding
│   ├── Login Screen
│   └── Signup Screen
│
├── Main Tabs (Bottom Navigation)
│   ├── 🏠 Home Tab
│   │   ├── Home Feed (posts list + state filter dropdown)
│   │   ├── Post Detail
│   │   └── Create / Edit Post
│   │
│   ├── 🤝 Matches Tab
│   │   ├── My Matches (pending / accepted)
│   │   └── Suggested Partners
│   │
│   ├── 💬 Chat Tab
│   │   ├── Conversations List
│   │   └── Chat Screen
│   │
│   └── 👤 Profile Tab
│       ├── My Profile (view / edit)
│       ├── Other User Profile
│       ├── Notifications History
│       └── About Page
```

## 2.5 UX Principles

1. **Simplicity First** — Large text, clear buttons, minimal clutter (senior-friendly)
2. **High Contrast** — Accessible color palette meeting WCAG AA standards
3. **Forgiving Input** — Dropdowns over free-text where possible; confirmation dialogs for destructive actions
4. **Guided Onboarding** — Step-by-step profile creation with progress indicator
5. **Quick Wins** — Show suggested partners immediately after profile creation

---

# Part 3: Technical Implementation Plan

## 3.1 Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native (Expo managed workflow) |
| Backend API | Node.js + Express |
| Database | MongoDB Atlas (Mongoose ODM) |
| Real-time | Socket.IO |
| Push Notifications | Firebase Cloud Messaging (free) |
| Auth | JWT (access + refresh tokens) |

## 3.2 Project Structure

```
pickleball-finder/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── config/             # DB connection, env, constants
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── controllers/        # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── profileController.js
│   │   │   ├── postController.js
│   │   │   ├── matchController.js
│   │   │   ├── conversationController.js
│   │   │   ├── messageController.js
│   │   │   └── notificationController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verification
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Post.js
│   │   │   ├── Match.js
│   │   │   ├── Conversation.js
│   │   │   ├── Message.js
│   │   │   └── Notification.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── profileRoutes.js
│   │   │   ├── postRoutes.js
│   │   │   ├── matchRoutes.js
│   │   │   ├── conversationRoutes.js
│   │   │   └── notificationRoutes.js
│   │   ├── services/
│   │   │   ├── matchmakingService.js
│   │   │   └── firebaseService.js
│   │   ├── sockets/
│   │   │   └── chatSocket.js
│   │   ├── utils/
│   │   │   ├── usStates.js
│   │   │   └── helpers.js
│   │   └── app.js              # Express app setup
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Entry point
│
├── mobile/                     # React Native (Expo)
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js       # Axios instance
│   │   │   ├── auth.js
│   │   │   ├── posts.js
│   │   │   ├── matches.js
│   │   │   ├── conversations.js
│   │   │   └── profile.js
│   │   ├── components/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Card.js
│   │   │   ├── StateDropdown.js
│   │   │   ├── SkillBadge.js
│   │   │   ├── PostCard.js
│   │   │   ├── MatchCard.js
│   │   │   └── ChatBubble.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useSocket.js
│   │   ├── navigation/
│   │   │   ├── AppNavigator.js
│   │   │   ├── AuthStack.js
│   │   │   └── MainTabs.js
│   │   ├── screens/
│   │   │   ├── SplashScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── SignupScreen.js
│   │   │   ├── HomeFeedScreen.js
│   │   │   ├── PostDetailScreen.js
│   │   │   ├── CreatePostScreen.js
│   │   │   ├── MatchesScreen.js
│   │   │   ├── SuggestedPartnersScreen.js
│   │   │   ├── ChatListScreen.js
│   │   │   ├── ChatScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   ├── EditProfileScreen.js
│   │   │   ├── UserProfileScreen.js
│   │   │   ├── NotificationsScreen.js
│   │   │   └── AboutScreen.js
│   │   ├── services/
│   │   │   ├── firebase.js
│   │   │   ├── socket.js
│   │   │   └── storage.js
│   │   ├── theme/
│   │   │   ├── colors.js
│   │   │   ├── typography.js
│   │   │   └── spacing.js
│   │   └── utils/
│   │       ├── constants.js
│   │       └── usStates.js
│   ├── app.json
│   ├── App.js
│   └── package.json
│
├── PLAN.md                     # ← This file
└── README.md
```

## 3.3 Database Schema

### User
```js
{
  name:          String,          // required
  email:         String,          // unique, required
  passwordHash:  String,          // bcrypt hashed, required
  phone:         String,          // optional
  avatar:        String,          // URL
  bio:           String,          // max 500 chars
  skillLevel:    String,          // enum: Beginner | Intermediate | Advanced
  ageRange:      String,          // e.g. "60-65"
  state:         String,          // US state (from dropdown)
  city:          String,
  zipCode:       String,
  availability:  [String],        // e.g. ["Mon AM", "Wed PM"]
  playStyle:     String,          // enum: Singles | Doubles | Both
  fcmToken:      String,          // Firebase Cloud Messaging device token
  profileComplete: Boolean,      // true after first profile setup
  createdAt:     Date,
  updatedAt:     Date
}
// Indexes: { email: 1 }, { state: 1, skillLevel: 1 }
```

### Post
```js
{
  author:        ObjectId → User,
  title:         String,          // required, max 100 chars
  description:   String,          // required, max 1000 chars
  state:         String,          // required — US state filter
  city:          String,
  skillLevel:    String,          // desired partner level
  playStyle:     String,          // Singles | Doubles | Both
  preferredTime: [String],        // availability slots
  status:        String,          // enum: Open | Closed
  createdAt:     Date,
  updatedAt:     Date
}
// Indexes: { state: 1, status: 1 }, { author: 1 }
```

### Match
```js
{
  users:         [ObjectId → User],  // exactly 2 user refs
  post:          ObjectId → Post,    // optional — if originated from post
  status:        String,             // enum: Pending | Accepted | Declined
  initiatedBy:   ObjectId → User,
  score:         Number,             // compatibility score (0-100)
  createdAt:     Date
}
// Indexes: { users: 1 }, { status: 1 }
```

### Conversation
```js
{
  participants:  [ObjectId → User],  // exactly 2 user refs
  lastMessage:   {
    text:   String,
    sentAt: Date,
    sender: ObjectId → User
  },
  createdAt:     Date,
  updatedAt:     Date
}
// Indexes: { participants: 1 }
```

### Message
```js
{
  conversation:  ObjectId → Conversation,
  sender:        ObjectId → User,
  text:          String,
  read:          Boolean,            // default: false
  createdAt:     Date
}
// Indexes: { conversation: 1, createdAt: 1 }
```

### Notification
```js
{
  user:          ObjectId → User,
  type:          String,             // enum: match_request | match_accepted | new_message | new_post
  title:         String,
  body:          String,
  data:          Object,             // { matchId, postId, conversationId, etc. }
  read:          Boolean,            // default: false
  createdAt:     Date
}
// Indexes: { user: 1, read: 1, createdAt: -1 }
```

## 3.4 Matchmaking Algorithm

The suggestion engine scores potential partners on a **0-100 scale**:

| Factor | Weight | Logic |
|---|---|---|
| **Same state** | 30 pts | Exact match on state |
| **Same city** | 20 pts | Bonus on top of state match |
| **Skill compatibility** | 25 pts | Same level = 25, ±1 tier = 15, ±2 tiers = 0 |
| **Schedule overlap** | 15 pts | `(overlapping_slots / total_slots) × 15` |
| **Play style match** | 10 pts | Same preference or either is "Both" = 10 |

Results are sorted by score descending. Users already matched (any status) are excluded.

## 3.5 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register (name, email, password, phone) |
| `POST` | `/api/auth/login` | Login → returns access + refresh JWT |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/forgot-password` | Email-based reset (future) |

### Profile
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile/me` | Get authenticated user's profile |
| `PUT` | `/api/profile/me` | Update profile fields |
| `GET` | `/api/profile/:id` | View another user's public profile |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/posts` | Create a new post |
| `GET` | `/api/posts` | List posts (query: `?state=&skillLevel=&playStyle=&page=&limit=`) |
| `GET` | `/api/posts/:id` | Get single post with author details |
| `PUT` | `/api/posts/:id` | Update own post |
| `DELETE` | `/api/posts/:id` | Delete own post |
| `GET` | `/api/posts/mine` | List current user's posts |

### Matchmaking
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/matches` | Send match request (`{ targetUserId, postId? }`) |
| `GET` | `/api/matches` | List user's matches (query: `?status=`) |
| `PUT` | `/api/matches/:id` | Accept or decline (`{ status: "Accepted" | "Declined" }`) |
| `GET` | `/api/matches/suggestions` | Get top 20 suggested partners |

### Messaging
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/conversations` | List user's conversations (sorted by last message) |
| `GET` | `/api/conversations/:id/messages` | Get messages (query: `?page=&limit=`) |
| `POST` | `/api/conversations/:id/messages` | Send message (REST fallback) |

**Socket.IO Events** (real-time):
| Event | Direction | Payload |
|---|---|---|
| `join_conversation` | Client → Server | `{ conversationId }` |
| `send_message` | Client → Server | `{ conversationId, text }` |
| `receive_message` | Server → Client | `{ message }` |
| `typing` | Bidirectional | `{ conversationId, userId }` |
| `message_read` | Client → Server | `{ messageId }` |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/notifications/register` | Register FCM device token |
| `GET` | `/api/notifications` | List notification history (paginated) |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |

### Utility
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/states` | Return list of US states (for dropdown) |
| `GET` | `/api/about` | Return about page content |

## 3.6 Notification Triggers

All push via **Firebase Cloud Messaging** (free):

| Event | Notification Title | Body Example |
|---|---|---|
| Match request received | "New Partner Request!" | "Martha wants to play with you" |
| Match accepted | "It's a Match! 🎉" | "Robert accepted your request. Start chatting!" |
| New message | "New Message" | "Martha: See you at the court tomorrow!" |
| New post in your state | "New Post in Florida" | "Looking for doubles partner in Miami" |

## 3.7 Environment Variables

```env
# backend/.env
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://shauryamadiraju7_db_user:hOvKsJs5C3TbuRYM@cluster0.y7glhk6.mongodb.net/pickleball-finder

# JWT
JWT_SECRET=<generate-a-strong-secret>
JWT_REFRESH_SECRET=<generate-another-strong-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json
```

---

# Part 4: Phased Delivery Plan

## Phase 1 — Foundation *(Week 1-2)*
- [ ] Scaffold backend (Express + Mongoose + JWT)
- [ ] Connect to MongoDB Atlas
- [ ] Implement User model, Auth APIs (signup, login, refresh)
- [ ] Implement Profile APIs (get, update)
- [ ] Initialize Expo app with navigation
- [ ] Build Splash, Login, Signup screens
- [ ] Build Profile create/edit screens
- [ ] Auth context + secure token storage

**Deliverable**: Users can sign up, log in, and set up their profile.

## Phase 2 — Posts & Discovery *(Week 2-3)*
- [ ] Implement Post model + CRUD APIs
- [ ] Add US states utility + `/api/states` endpoint
- [ ] Build Home Feed screen with state dropdown filter
- [ ] Build Create/Edit Post screen
- [ ] Build Post Detail screen
- [ ] Pagination on feed

**Deliverable**: Users can create posts and browse by state.

## Phase 3 — Matchmaking *(Week 3-4)*
- [ ] Implement Match model + APIs
- [ ] Build matchmaking scoring service
- [ ] Build Matches screen (pending/accepted tabs)
- [ ] Build Suggested Partners screen
- [ ] Add match request button on Post Detail + user profiles
- [ ] Auto-create Conversation on match acceptance

**Deliverable**: Users get matched with compatible partners.

## Phase 4 — Real-time Messaging *(Week 4-5)*
- [ ] Integrate Socket.IO on backend
- [ ] Implement Conversation + Message models & APIs
- [ ] Build Chat List screen
- [ ] Build Chat screen with real-time messaging
- [ ] Typing indicators + read receipts

**Deliverable**: Matched users can chat in real-time.

## Phase 5 — Notifications *(Week 5-6)*
- [ ] Set up Firebase project + Cloud Messaging
- [ ] Integrate Firebase Admin SDK on backend
- [ ] Add `@react-native-firebase/messaging` to mobile
- [ ] Wire FCM triggers to match/message events
- [ ] Implement Notification model + history API
- [ ] Build Notifications screen

**Deliverable**: Users receive push notifications for all key events.

## Phase 6 — Polish & Launch *(Week 6-7)*
- [ ] About page (API + screen)
- [ ] Image upload for avatars (Cloudinary or base64 MVP)
- [ ] Forgot-password flow
- [ ] Loading states, error handling, empty states
- [ ] Accessibility review (font sizes, contrast, touch targets)
- [ ] App icons + splash screen branding
- [ ] Final testing on Android + iOS
- [ ] Prepare for app store submission

**Deliverable**: Production-ready app.

---

# Part 5: Verification Plan

## Automated Testing
- **Backend**: Jest + Supertest
  - Auth flow: signup → login → access protected route
  - Post CRUD with authorization checks
  - Matchmaking score calculation unit tests
  - Command: `cd backend && npm test`
- **Mobile**: Jest + React Native Testing Library
  - Component rendering tests
  - Command: `cd mobile && npm test`

## Manual Testing Checklist
- [ ] Signup → Login → Profile setup → Verify data in MongoDB
- [ ] Create post → See it in feed → Filter by state → Verify correct filtering
- [ ] Send match request → Other user accepts → Verify conversation created
- [ ] Send messages → Verify real-time delivery via Socket.IO
- [ ] Trigger match → Verify push notification on device
- [ ] Test on both Android emulator and iOS simulator
- [ ] Test on physical device (Expo Go)
- [ ] Test with slow network / offline states
- [ ] Verify all dropdowns populate correctly (states, skill levels)
- [ ] Verify JWT refresh works after token expiry

---

# Appendix

## A. US States Dropdown Values
All 50 states + DC, stored as a utility array on both backend and mobile:
```
Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut,
Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa,
Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan,
Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada,
New Hampshire, New Jersey, New Mexico, New York, North Carolina,
North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island,
South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont,
Virginia, Washington, West Virginia, Wisconsin, Wyoming,
District of Columbia
```

## B. Skill Level Definitions
| Level | Description |
|---|---|
| **Beginner** | Learning rules and basic strokes; less than 6 months of play |
| **Intermediate** | Consistent rallies; understands strategy; 6-24 months of play |
| **Advanced** | Strong serves, dinks, and third-shot drops; tournament-level play |

## C. Availability Slot Format
14 slots total — 7 days × 2 periods:
```
Mon AM, Mon PM, Tue AM, Tue PM, Wed AM, Wed PM, Thu AM, Thu PM,
Fri AM, Fri PM, Sat AM, Sat PM, Sun AM, Sun PM
```
