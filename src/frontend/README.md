# ReCamp Frontend

Modern React/Next.js frontend for the ReCamp campground booking platform.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS
- **State Management:** Zustand + React Query
- **Maps:** Mapbox GL
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Forms:** React Hook Form
- **Date Handling:** date-fns

## 📁 Project Structure

```
src/frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── campgrounds/         # Campground pages
│   ├── login/               # Login page
│   └── register/            # Register page
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── layout/              # Layout components
│   ├── campgrounds/         # Campground-specific
│   ├── reviews/             # Review components
│   └── auth/                # Auth components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and configs
│   ├── api/                 # API client
│   ├── utils/               # Helper functions
│   ├── constants.ts         # App constants
│   └── providers.tsx        # React providers
├── stores/                  # Zustand stores
├── types/                   # TypeScript definitions
└── styles/                  # Additional styles
```

## 🛠️ Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend API running on port 3000

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
```

### Environment Variables

Create `.env.local` with:

```env
# API URL (backend)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Mapbox token (required for maps)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
```

## 🏃 Running the App

### Development Mode

```bash
npm run dev
```

Frontend will start on **http://localhost:3001**

### Production Build

```bash
npm run build
npm run start
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Type checking
npm run type-check
```

## 📦 Key Features

### Pages

- **Home** - Hero, features, stats, featured campgrounds
- **Campgrounds Index** - Grid/map views, search, filters
- **Campground Detail** - Images, info, reviews, map
- **Create/Edit Campground** - Forms with image upload
- **Login/Register** - Authentication

### Components

#### UI Components
- `Button` - Multiple variants and sizes
- `Card` - Container with sections
- `Input` / `Textarea` - Form inputs with validation
- `Badge` - Status indicators
- `Loading` - Spinner, skeleton loaders

#### Layout Components
- `Navbar` - Responsive with mobile menu
- `Footer` - Brand, links, social
- `FlashMessages` - Toast notifications
- `MainLayout` - App wrapper

#### Feature Components
- `CampgroundCard` - Campground preview
- `CampgroundsMap` - Interactive Mapbox map
- `CampgroundCarousel` - Image carousel
- `CampgroundForm` - Create/edit form
- `StarRating` - Interactive rating
- `ReviewCard` / `ReviewForm` - Reviews

### State Management

#### Zustand Stores
- `authStore` - User authentication state
- `uiStore` - UI state (flash messages, modals)

#### React Query
- Server state with automatic caching
- Background refetching
- Optimistic updates

### Custom Hooks

- `useAuth()` - Authentication operations
- `useCampground()` - Campground CRUD
- `useReview()` - Review operations

## 🎨 Design System

### Colors

Primary palette (Emerald/Teal):
- `emerald-600` - Primary actions
- `teal-500` - Accents
- `gray-*` - Neutrals

### Typography

- **Font:** Inter (Google Fonts)
- **Headings:** Bold, large sizes
- **Body:** Regular, readable

### Spacing

Tailwind spacing scale (4px base unit)

## 🔒 Authentication

Session-based authentication with HTTP-only cookies.

### Protected Routes

Use `AuthGuard` component:

```tsx
import { AuthGuard } from '@/components/auth';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <YourContent />
    </AuthGuard>
  );
}
```

### Auth State

Access auth state via `useAuth()`:

```tsx
const { user, isAuthenticated, login, logout } = useAuth();
```

## 🗺️ Maps Integration

Mapbox GL for interactive maps.

### Setup

1. Get API token from [Mapbox](https://mapbox.com)
2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token
   ```

### Usage

```tsx
import { CampgroundsMap } from '@/components/campgrounds';

<CampgroundsMap campgrounds={data} />
```

## 📡 API Integration

### API Client

Configured Axios instance with interceptors:

```tsx
import { apiClient } from '@/lib/api';

const response = await apiClient.get('/campgrounds');
```

### Endpoints

All API functions in `lib/api/endpoints.ts`:

```tsx
import { campgroundsApi } from '@/lib/api';

// Get all campgrounds
const campgrounds = await campgroundsApi.getAll();

// Get single campground
const campground = await campgroundsApi.getById(id);

// Create campground
const newCampground = await campgroundsApi.create(data);
```

## 🧪 Testing

*Testing infrastructure to be added in Phase 4*

Planned:
- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Playwright

## 🚢 Deployment

### Build

```bash
npm run build
```

### Environment Variables (Production)

Set the following in your hosting platform:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk.production_token
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=production_cloud
```

### Hosting Platforms

Compatible with:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Docker containers

## 📚 Documentation

- [Phase 3 Plan](../../docs/PHASE3_PLAN.md)
- [Phase 3 Complete](../../docs/PHASE3_COMPLETE.md)
- [Phase 3 Summary](../../docs/PHASE3_SUMMARY.md)
- [Migration Status](../../docs/MIGRATION_STATUS.md)

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use Tailwind CSS for styling
3. Create reusable components
4. Add proper types
5. Handle loading/error states
6. Test on mobile devices

## 📝 Code Style

### Component Structure

```tsx
/**
 * Component description
 */

'use client'; // If client component

import { ... } from '...';

interface ComponentProps {
  // Props
}

export function Component({ props }: ComponentProps) {
  // Logic
  
  return (
    // JSX
  );
}
```

### Naming Conventions

- Components: PascalCase (`Button`, `CampgroundCard`)
- Files: PascalCase for components (`Button.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth`)
- Types: PascalCase interfaces (`User`, `Campground`)
- Functions: camelCase (`formatPrice`, `handleClick`)

## 🐛 Common Issues

### Mapbox not displaying

- Check `NEXT_PUBLIC_MAPBOX_TOKEN` is set
- Verify token is valid
- Check browser console for errors

### API calls failing

- Ensure backend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is configured on backend

### Images not uploading

- Check Cloudinary credentials
- Verify backend has proper Cloudinary config
- Check file size limits

## 📄 License

This project is part of the Recamp migration.

## 👥 Team

**Frontend Agent** - Phase 3 Lead

---

**Status:** ✅ Production Ready  
**Last Updated:** February 7, 2026
