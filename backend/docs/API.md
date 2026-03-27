# Pickleball Finder — Backend API Reference

**Base URL:** `http://localhost:8081/api`

---

## Health Check

### `GET /api/health`

Check if the server is running.

```bash
curl http://localhost:8081/api/health
```

**Response** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-03-20T01:54:00.000Z"
}
```

---

## Authentication

### `POST /api/auth/signup`

Register a new user. Optionally provide profile details during signup.

**Request Body**

| Field          | Type     | Required | Description                                      |
|----------------|----------|----------|--------------------------------------------------|
| `name`         | String   | ✅       | User's full name                                 |
| `email`        | String   | ✅       | Unique email address                             |
| `password`     | String   | ✅       | Min 6 characters                                 |
| `phone`        | String   | ❌       | Phone number                                     |
| `skillLevel`   | String   | ❌       | `Beginner`, `Intermediate`, or `Advanced`        |
| `playStyle`    | String   | ❌       | `Singles`, `Doubles`, or `Both`                  |
| `state`        | String   | ❌       | US state                                         |
| `city`         | String   | ❌       | City                                             |
| `zipCode`      | String   | ❌       | Zip code                                         |
| `ageRange`     | String   | ❌       | e.g. `"60-65"`                                   |
| `bio`          | String   | ❌       | Short bio (max 500 chars)                        |
| `availability` | [String] | ❌       | e.g. `["Mon AM", "Wed PM"]`                      |

**Signup (basic — required fields only):**
```bash
curl -X POST http://localhost:8081/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Signup (with profile details):**
```bash
curl -X POST http://localhost:8081/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Martha Wilson",
    "email": "martha@example.com",
    "password": "password123",
    "skillLevel": "Intermediate",
    "playStyle": "Doubles",
    "state": "Florida",
    "city": "Sarasota",
    "ageRange": "65-70",
    "availability": ["Mon AM", "Wed AM", "Fri PM"]
  }'
```

**Response** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "660...",
    "name": "Martha Wilson",
    "email": "martha@example.com",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "profileComplete": true
  }
}
```

**Error Responses**
- `400` — Missing required fields or user already exists

---

### `POST /api/auth/login`

Login with email and password.

**Request Body**

| Field      | Type   | Required | Description          |
|------------|--------|----------|----------------------|
| `email`    | String | ✅       | Registered email     |
| `password` | String | ✅       | Account password     |

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "660...",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses**
- `400` — Missing email or password
- `401` — Invalid email or password

---

### `POST /api/auth/forgot-password`

Request a password reset token.

**Request Body**

| Field   | Type   | Required | Description              |
|---------|--------|----------|--------------------------|
| `email` | String | ✅       | Registered email address |

```bash
curl -X POST http://localhost:8081/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Password reset token generated. Use it with /api/auth/reset-password.",
  "resetToken": "a1b2c3d4e5f6..."
}
```

**Error Responses**
- `400` — Missing email
- `404` — No user found with this email

> **Note:** In production, the `resetToken` should be sent via email instead of being returned in the response.

---

### `POST /api/auth/reset-password/:token`

Reset password using the token from forgot-password.

**URL Params**

| Param   | Description                              |
|---------|------------------------------------------|
| `token` | Reset token received from forgot-password |

**Request Body**

| Field      | Type   | Required | Description       |
|------------|--------|----------|-------------------|
| `password` | String | ✅       | New password (min 6 chars) |

```bash
curl -X POST http://localhost:8081/api/auth/reset-password/YOUR_RESET_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newpassword456"
  }'
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "_id": "660...",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses**
- `400` — Missing password or invalid/expired token

---

## Profile (🔒 Requires Auth Token)

> All profile endpoints require the `Authorization: Bearer <token>` header.

### `GET /api/profile/me`

Get the authenticated user's profile.

```bash
curl http://localhost:8081/api/profile/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "660...",
    "user": {
      "_id": "660...",
      "name": "Martha Wilson",
      "email": "martha@example.com"
    },
    "skillLevel": "Intermediate",
    "playStyle": "Doubles",
    "state": "Florida",
    "city": "Sarasota",
    "ageRange": "65-70",
    "availability": ["Mon AM", "Wed AM", "Fri PM"],
    "profileComplete": true,
    "createdAt": "2026-03-20T...",
    "updatedAt": "2026-03-20T..."
  }
}
```

**Error Responses**
- `401` — Not authorized
- `404` — Profile not found

---

### `PUT /api/profile/me`

Create or update the authenticated user's profile (upsert).

**Request Body** (all fields optional)

| Field          | Type     | Description                               |
|----------------|----------|-------------------------------------------|
| `phone`        | String   | Phone number                              |
| `avatar`       | String   | Avatar URL                                |
| `bio`          | String   | Short bio (max 500 chars)                 |
| `skillLevel`   | String   | `Beginner`, `Intermediate`, `Advanced`    |
| `ageRange`     | String   | e.g. `"60-65"`                            |
| `state`        | String   | US state                                  |
| `city`         | String   | City                                      |
| `zipCode`      | String   | Zip code                                  |
| `availability` | [String] | e.g. `["Mon AM", "Wed PM"]`              |
| `playStyle`    | String   | `Singles`, `Doubles`, `Both`              |

```bash
curl -X PUT http://localhost:8081/api/profile/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "skillLevel": "Advanced",
    "playStyle": "Both",
    "state": "Florida",
    "city": "Tampa",
    "bio": "Looking for competitive doubles partners!",
    "availability": ["Mon AM", "Tue PM", "Sat AM"]
  }'
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

### `POST /api/profile/me`

Alias for `PUT /api/profile/me` (create or update).

---

### `GET /api/profile/:userId`

View another user's public profile by their user ID.

```bash
curl http://localhost:8081/api/profile/660abc123def456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Responses**
- `404` — Profile not found

---

### `DELETE /api/profile/me`

Delete the authenticated user's profile.

```bash
curl -X DELETE http://localhost:8081/api/profile/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

---

## Posts

### `GET /api/posts`

Fetch posts for the feed. Supports optional filters via query params.

**Query params** (all optional)
- `state` (string)
- `skillLevel` (`Beginner`, `Intermediate`, `Advanced`)
- `playStyle` (`Singles`, `Doubles`, `Both`)
- `status` (`Open`, `Closed`)
- `page` (number, default `1`)
- `limit` (number, default `20`)

```bash
curl http://localhost:8081/api/posts?state=Florida&skillLevel=Intermediate&page=1&limit=20
```

**Response** `200 OK`

---

### `POST /api/posts`

Create a new post.

```bash
curl -X POST http://localhost:8081/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Looking for doubles partner",
    "description": "Competitive but friendly. Weekday mornings work best.",
    "state": "Florida",
    "city": "Tampa",
    "skillLevel": "Intermediate",
    "playStyle": "Doubles",
    "preferredTime": ["Mon AM", "Wed PM"],
    "status": "Open"
  }'
```

**Response** `201 Created`

### `PUT /api/posts/:id`

Update your own post.

```bash
curl -X PUT http://localhost:8081/api/posts/YOUR_POST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "city": "Orlando",
    "preferredTime": ["Tue AM", "Thu PM"],
    "status": "Open"
  }'
```

**Response** `200 OK`

---

## Matchmaking (🔒 Requires Auth Token)

### `GET /api/matchmaking/nearby`

Find nearby players using profile latitude/longitude saved in their profile `location`.

**Query params**
- `lat` (number, required)
- `lng` (number, required)
- `radiusKm` (number, optional, default `25`)
- `skillLevel` (optional: `Beginner` | `Intermediate` | `Advanced`)
- `playStyle` (optional: `Singles` | `Doubles` | `Both`)
- `limit` (optional, default `50`, max `200`)

```bash
curl "http://localhost:8081/api/matchmaking/nearby?lat=27.9506&lng=-82.4572&radiusKm=20&skillLevel=Intermediate&limit=25" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response** `200 OK`

---

## Users

### `GET /api/users`

Placeholder route (to be expanded).

```bash
curl http://localhost:8081/api/users
```

**Response** `200 OK`
```json
{
  "message": "User routes working"
}
```

---

## Common Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "message": "Description of the error"
}
```

In development mode (`NODE_ENV=development`), unhandled errors also include a `stack` trace.

---

## Authentication Notes

- **JWT Token** is returned on signup, login, and password reset.
- Include the token in authenticated requests:
  ```
  Authorization: Bearer <token>
  ```
- Tokens expire after **7 days** (configurable via `JWT_EXPIRE` in `.env`).
- Reset tokens expire after **10 minutes**.
- Profile is marked as `profileComplete: true` when `skillLevel`, `state`, and `city` are all filled.
