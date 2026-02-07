# Backend API Documentation

## Overview

This document describes the RESTful API endpoints available in the Recamp backend after Phase 2 migration.

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require authentication using session-based authentication with Passport.js.

### Session Cookie

- Cookie name: `mainCookie`
- HTTP Only: Yes
- Expires: 7 days
- Secure: Production only

## Endpoints

### Home

#### GET /
Get home page with featured campgrounds and statistics.

**Response:**
```json
{
  "featuredCampgrounds": [...],
  "stats": {
    "campgrounds": 123,
    "reviews": 456,
    "users": 78
  }
}
```

---

### Authentication

#### GET /register
Render registration form.

#### POST /register
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password"
}
```

**Success:** Redirects to `/campgrounds`

---

#### GET /login
Render login form.

#### POST /login
Login existing user.

**Body:**
```json
{
  "username": "username",
  "password": "password"
}
```

**Success:** Redirects to return URL or `/campgrounds`

---

#### GET /logout
Logout current user.

**Success:** Redirects to `/campgrounds`

---

### Campgrounds

#### GET /campgrounds
List all campgrounds.

**Response:**
```json
[
  {
    "_id": "...",
    "title": "Mountain View",
    "location": "Colorado",
    "price": 25,
    "description": "...",
    "images": [...],
    "geometry": {...},
    "author": {...}
  }
]
```

---

#### GET /campgrounds/new
Render new campground form.

**Auth Required:** Yes

---

#### POST /campgrounds
Create a new campground.

**Auth Required:** Yes

**Body (multipart/form-data):**
```
campground[title]: "Mountain View"
campground[location]: "Colorado"
campground[price]: 25
campground[description]: "Beautiful mountain camping"
images: [file1, file2, ...]
```

**Success:** Redirects to `/campgrounds/:id`

---

#### GET /campgrounds/:id
Get single campground with reviews and authors.

**Response:**
```json
{
  "_id": "...",
  "title": "Mountain View",
  "location": "Colorado",
  "price": 25,
  "description": "...",
  "images": [...],
  "geometry": {...},
  "author": {
    "_id": "...",
    "username": "..."
  },
  "reviews": [...]
}
```

---

#### GET /campgrounds/:id/edit
Render edit campground form.

**Auth Required:** Yes (must be author)

---

#### PUT /campgrounds/:id
Update a campground.

**Auth Required:** Yes (must be author)

**Body (multipart/form-data):**
```
campground[title]: "Updated Title"
campground[location]: "Updated Location"
campground[price]: 30
campground[description]: "Updated description"
images: [new files...]
deleteImages: ["filename1", "filename2"]
```

**Success:** Redirects to `/campgrounds/:id`

---

#### DELETE /campgrounds/:id
Delete a campground.

**Auth Required:** Yes (must be author)

**Success:** Redirects to `/campgrounds`

---

### Reviews

#### POST /campgrounds/:id/reviews
Create a review for a campground.

**Auth Required:** Yes

**Body:**
```json
{
  "review": {
    "rating": 5,
    "body": "Great place!"
  }
}
```

**Success:** Redirects to `/campgrounds/:id`

---

#### DELETE /campgrounds/:id/reviews/:reviewId
Delete a review.

**Auth Required:** Yes (must be review author)

**Success:** Redirects to `/campgrounds/:id`

---

## Error Responses

All errors follow this format:

**Error Page:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
</head>
<body>
  <h1>Error: {{ statusCode }}</h1>
  <p>{{ message }}</p>
</body>
</html>
```

### Common Status Codes

- `200` - Success
- `302` - Redirect
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Data Models

### Campground

```typescript
interface ICampground {
  _id: ObjectId;
  title: string;
  images: IImage[];
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  price: number;
  description: string;
  location: string;
  author: ObjectId;
  reviews: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Review

```typescript
interface IReview {
  _id: ObjectId;
  body: string;
  rating: number;
  author: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### User

```typescript
interface IUser {
  _id: ObjectId;
  email: string;
  username: string;
  // password hash and salt managed by passport-local-mongoose
  createdAt: Date;
  updatedAt: Date;
}
```

## Validation Rules

### Campground

- `title`: Required, string, no HTML
- `location`: Required, string, no HTML
- `price`: Required, number, minimum 0
- `description`: Required, string, no HTML
- `images`: Optional, array of image files

### Review

- `rating`: Required, number, 1-5
- `body`: Required, string, no HTML

### User

- `email`: Required, valid email, unique
- `username`: Required, string, unique
- `password`: Required, minimum length varies

## Rate Limiting

Currently no rate limiting implemented. This should be added in production.

## CORS

CORS is not enabled by default. API is intended for same-origin use with server-side rendering.

## Security

- Helmet enabled with strict CSP
- MongoDB sanitization enabled
- HTML sanitization in validation
- Session security with httpOnly cookies
- HTTPS enforced in production

## Testing

Run tests with:
```bash
npm run test:backend
```

## Notes

- All routes render EJS views (server-side rendering)
- File uploads go to Cloudinary
- Geocoding uses Mapbox
- Sessions stored in MongoDB
