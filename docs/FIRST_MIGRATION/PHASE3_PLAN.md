# Phase 3: Frontend Migration - Implementation Plan

## Overview

Phase 3 focuses on migrating the EJS/Bootstrap views to a modern React/Next.js frontend with TypeScript, Tailwind CSS, and Zustand state management.

## Current State Analysis

### Existing EJS Views
- **Home Page** - Hero section, features, stats, featured campgrounds
- **Campgrounds Index** - List view with Mapbox cluster map
- **Campground Show** - Detail view with carousel, map, reviews
- **Campground New/Edit** - Forms for creating/editing
- **Auth Pages** - Login and Register
- **Partials** - Navbar, Footer, Flash messages
- **Error Page** - Error handling

### Technologies Used in Legacy
- Bootstrap 5
- Mapbox GL JS v3.15.0
- Bootstrap Icons
- EJS templating
- Custom CSS

## Target Architecture

### Frontend Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** React Query (TanStack Query)
- **HTTP Client:** Axios
- **Maps:** react-map-gl (Mapbox)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React (modern, tree-shakeable)

### Directory Structure
```
src/frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/
│   │   └── register/
│   ├── (main)/                   # Main layout group
│   │   ├── campgrounds/
│   │   │   ├── [id]/
│   │   │   │   ├── edit/
│   │   │   │   └── page.tsx
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   └── page.tsx              # Home page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── MainLayout.tsx
│   ├── campgrounds/              # Feature-specific
│   │   ├── CampgroundCard.tsx
│   │   ├── CampgroundMap.tsx
│   │   ├── CampgroundCarousel.tsx
│   │   ├── CampgroundForm.tsx
│   │   └── CampgroundFilters.tsx
│   └── reviews/
│       ├── ReviewCard.tsx
│       ├── ReviewForm.tsx
│       └── StarRating.tsx
├── features/                     # Feature modules
│   ├── auth/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── api/
│   └── campgrounds/
│       ├── hooks/
│       ├── components/
│       └── api/
├── lib/                          # Utilities and configs
│   ├── api/                      # API client
│   │   ├── axios.ts
│   │   ├── endpoints.ts
│   │   └── client.ts
│   ├── utils/                    # Helper functions
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── errors.ts
│   └── constants.ts
├── hooks/                        # Shared custom hooks
│   ├── useAuth.ts
│   ├── useCampgrounds.ts
│   └── useMap.ts
├── stores/                       # Zustand stores
│   ├── authStore.ts
│   ├── campgroundStore.ts
│   └── uiStore.ts
├── types/                        # TypeScript types
│   ├── api.ts
│   ├── campground.ts
│   ├── review.ts
│   └── user.ts
└── styles/                       # Additional styles
    └── mapbox.css
```

## Implementation Phases

### Phase 3.1: Foundation & Setup ✅

**Dependencies to Install:**
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "react-map-gl": "^7.1.0",
    "mapbox-gl": "^3.15.0",
    "react-hook-form": "^7.49.0",
    "lucide-react": "^0.300.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",
    "date-fns": "^3.0.0"
  }
}
```

**Tasks:**
- [ ] Install dependencies
- [ ] Configure Tailwind CSS with custom theme
- [ ] Set up shared types from backend
- [ ] Create API client configuration
- [ ] Set up React Query provider
- [ ] Configure environment variables

### Phase 3.2: Shared Types & API Client

**Tasks:**
- [ ] Create shared TypeScript interfaces
  - Campground, Review, User types
  - API request/response types
  - Form validation schemas
- [ ] Build Axios API client
  - Base configuration with interceptors
  - Authentication header injection
  - Error handling
- [ ] Create API endpoints functions
  - Campgrounds CRUD
  - Reviews CRUD
  - Auth endpoints
  - File upload handling

### Phase 3.3: State Management

**Tasks:**
- [ ] Set up Zustand stores
  - **authStore** - User authentication state
  - **uiStore** - UI state (modals, toasts, loading)
  - **campgroundStore** - Optional local cache/filters
- [ ] Create custom hooks
  - `useAuth()` - Authentication utilities
  - `useCampground()` - Campground operations
  - `useReview()` - Review operations

### Phase 3.4: UI Component Library

**Core Components:**
- [ ] Button - Primary, secondary, outline variants
- [ ] Card - Container component
- [ ] Input - Text, email, password, textarea
- [ ] Badge - Status indicators
- [ ] Avatar - User profile pictures
- [ ] Modal - Dialog component
- [ ] Toast - Notification system
- [ ] Loading - Spinner, skeleton loaders
- [ ] Dropdown - Menu component

**Form Components:**
- [ ] FormField - Field wrapper with label/error
- [ ] FileUpload - Image upload with preview
- [ ] Select - Dropdown select
- [ ] Checkbox - Checkbox input
- [ ] Radio - Radio buttons

### Phase 3.5: Layout Components

**Tasks:**
- [ ] **Navbar**
  - Logo and branding
  - Navigation links
  - User menu dropdown
  - Mobile responsive menu
  - Authentication state handling
  
- [ ] **Footer**
  - Company info
  - Quick links
  - Social media links
  - Newsletter signup
  
- [ ] **MainLayout**
  - Common layout wrapper
  - Flash message display
  - Error boundaries

### Phase 3.6: Home Page Migration

**Components to Build:**
- [ ] HeroSection - Hero with background image
- [ ] FeaturesSection - 3-column features
- [ ] StatsSection - Animated counters
- [ ] FeaturedCampgrounds - Preview cards
- [ ] CTASection - Call to action

**Features:**
- [ ] Animated counter for statistics
- [ ] Responsive design
- [ ] Fetch featured campgrounds from API
- [ ] Dynamic stats from backend

### Phase 3.7: Campgrounds Index Page

**Components:**
- [ ] CampgroundsMap - Cluster map with Mapbox
- [ ] CampgroundCard - Grid item card
- [ ] CampgroundFilters - Search and filter
- [ ] Pagination - Page navigation

**Features:**
- [ ] Interactive cluster map
- [ ] Grid/list view toggle
- [ ] Search functionality
- [ ] Filter by location, price
- [ ] Infinite scroll or pagination
- [ ] Loading states

### Phase 3.8: Campground Detail Page

**Components:**
- [ ] CampgroundCarousel - Image slider
- [ ] CampgroundInfo - Details card
- [ ] CampgroundMap - Single location map
- [ ] ReviewsList - Reviews display
- [ ] ReviewForm - Add review
- [ ] StarRating - Rating component

**Features:**
- [ ] Image carousel with navigation
- [ ] Mapbox single marker map
- [ ] Review submission
- [ ] Edit/delete for owner
- [ ] Responsive two-column layout

### Phase 3.9: Campground Create/Edit Forms

**Components:**
- [ ] CampgroundForm - Main form
- [ ] ImageUpload - Multiple image upload
- [ ] LocationPicker - Map-based picker (optional)

**Features:**
- [ ] React Hook Form integration
- [ ] Zod validation
- [ ] Image preview before upload
- [ ] Multi-image upload to Cloudinary
- [ ] Mapbox geocoding integration
- [ ] Form error handling
- [ ] Loading states during submission

### Phase 3.10: Authentication Pages

**Pages:**
- [ ] Login Page - Email/username and password
- [ ] Register Page - Email, username, password

**Features:**
- [ ] Form validation
- [ ] Error display
- [ ] Loading states
- [ ] Redirect after login
- [ ] Password visibility toggle
- [ ] "Remember me" option

### Phase 3.11: Authentication Flow

**Tasks:**
- [ ] Implement session-based auth
- [ ] Create AuthGuard for protected routes
- [ ] Handle authentication state
- [ ] Implement logout
- [ ] Persist user session
- [ ] Redirect logic

### Phase 3.12: Advanced Features

**Tasks:**
- [ ] Add toast notifications
- [ ] Implement error boundaries
- [ ] Add loading skeletons
- [ ] Create 404 page
- [ ] Add meta tags for SEO
- [ ] Implement image optimization
- [ ] Add page transitions

### Phase 3.13: Testing & Polish

**Tasks:**
- [ ] Test all pages and flows
- [ ] Fix responsive design issues
- [ ] Optimize performance
- [ ] Add accessibility features
- [ ] Cross-browser testing
- [ ] Fix any bugs

## Design System

### Color Palette (Tailwind)
```javascript
colors: {
  primary: {
    50: '#f0fdf9',
    500: '#20c997',
    600: '#198754',
  },
  // ... rest of palette
}
```

### Typography
- **Font:** Inter (Google Fonts)
- **Headings:** Bold, large sizes
- **Body:** Regular, readable sizes

### Spacing & Layout
- Container max-width: 1280px
- Grid: 12-column responsive grid
- Spacing: Tailwind spacing scale

## API Integration

### Backend Endpoints Used
```
GET    /                              → Home with stats
GET    /campgrounds                   → List all
GET    /campgrounds/:id               → Single campground
POST   /campgrounds                   → Create (auth)
PUT    /campgrounds/:id               → Update (auth, owner)
DELETE /campgrounds/:id               → Delete (auth, owner)
POST   /campgrounds/:id/reviews       → Create review (auth)
DELETE /campgrounds/:id/reviews/:rid  → Delete review (auth, owner)
POST   /register                      → Register user
POST   /login                         → Login user
GET    /logout                        → Logout user
```

### API Client Configuration
```typescript
// Base URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Axios instance with credentials
axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## Challenges & Solutions

### Challenge 1: Session-based Auth with Next.js
**Solution:** Use `withCredentials` in Axios and handle cookies properly. Consider using middleware for protected routes.

### Challenge 2: Mapbox Integration
**Solution:** Use `react-map-gl` library for React integration. Handle token securely via environment variables.

### Challenge 3: File Uploads
**Solution:** Use `FormData` for multipart uploads. Show progress and preview images client-side.

### Challenge 4: State Management
**Solution:** Use React Query for server state, Zustand only for UI/auth state.

### Challenge 5: Bootstrap to Tailwind Migration
**Solution:** Recreate similar UI with Tailwind utilities. Use custom components for complex Bootstrap features.

## Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## Development Workflow

1. **Start Backend:**
   ```bash
   npm run dev:backend
   ```

2. **Start Frontend:**
   ```bash
   npm run dev:frontend
   ```

3. **Full Stack:**
   ```bash
   npm run dev
   ```

## Success Criteria

- ✅ All EJS views migrated to React
- ✅ Tailwind CSS implemented
- ✅ Responsive on mobile, tablet, desktop
- ✅ Authentication working
- ✅ All CRUD operations functional
- ✅ Maps working with Mapbox
- ✅ Image uploads working
- ✅ Reviews system functional
- ✅ TypeScript strict mode with no errors
- ✅ Performance: First Contentful Paint < 2s
- ✅ No console errors

## Next Steps After Phase 3

- **Phase 4:** Testing (unit, integration, E2E)
- **Phase 5:** DevOps & deployment

---

**Phase 3 Status:** 🚀 STARTING
**Estimated Completion:** TBD
**Frontend Agent:** Leading implementation
