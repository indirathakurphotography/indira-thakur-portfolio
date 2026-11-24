# Indira Thakur Photography — Portfolio & Editorial Studio CMS

A full-stack portfolio, client inquiry platform, and headless editorial CMS built for **Indira Thakur Photography** (Tilak Nagar, Chembur, Mumbai). The application combines a responsive fine-art showcase with an authenticated Admin Dashboard for managing imagery, films, services, testimonials, FAQs, brand identity, metadata, analytics, and cloud object storage.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Public Features](#public-features)
- [Admin Dashboard & CMS](#admin-dashboard--cms)
- [Media & Object Storage Pipeline](#media--object-storage-pipeline)
- [SEO, Brand Logos & Social Sharing](#seo-brand-logos--social-sharing)
- [Authentication & Security Controls](#authentication--security-controls)
- [Project Structure](#project-structure)
- [Local Setup, Development & Deployment](#local-setup-development--deployment)
- [Verification & Troubleshooting](#verification--troubleshooting)

---

## Architecture Overview

- **Rendering & Routing**: Built on Next.js 16 (App Router) with React 19 and TypeScript. Public pages are server-rendered with on-demand cache revalidation when content changes in the Admin Dashboard.
- **Data Persistence**: MongoDB Atlas accessed via Mongoose schemas for portfolio items, films, services, reviews, FAQs, inquiries, home/about/footer copy, site configuration, SEO settings, brand settings, admin users, audit logs, security rules, and analytics events.
- **Media Delivery**: Assets are stored in Cloudflare R2 (S3-compatible object storage) and served publicly over `/api/media/[...path]` with streaming range support, caching headers, CORS support for crawlers, and on-the-fly image optimization using `sharp`.
- **Styling & Motion**: Tailwind CSS v4 with custom typography tokens (`Playfair Display`, `Inter`, `DM Mono`) loaded via `next/font/google`, paired with Framer Motion transitions.

---

## Technology Stack

- **Framework**: Next.js 16 (`App Router`), React 19, TypeScript 5
- **Styling & UI**: Tailwind CSS v4, Framer Motion, React Icons
- **Database**: MongoDB with Mongoose
- **Object Storage & Media Processing**: Cloudflare R2 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`), `sharp`
- **Authentication & Validation**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `zod`
- **Additional Integrations**:
  - `@google/genai` for the server-backed studio concierge endpoint (`/api/chat`)
  - Firebase Client Auth + Google Drive Picker/Audit (`GoogleDriveImportModal`) for read-only Drive folder inspection and deduplicated R2 imports
  - Meta Pixel (`MetaPixel`, `MetaPixelTracker`) and first-party page/event tracking (`AnalyticsTracker`, `/api/analytics/*`)

---

## Public Features

- **Editorial Landing Page (`/`)**: Hero showcase, studio philosophy preview, curated services grid, brand collaborations strip, films showcase, written and video testimonials, FAQs, and inquiry section.
- **Portfolio & Gallery (`/gallery`)**: Filterable category showcase (`newborn`, `maternity`, `birth-photography`, `toddler-child`, `family`, `portrait`, `weddings`, `events`, `brand-collaboration`) backed by server-fetched MongoDB records and lightbox viewing.
- **Services & Dedicated Detail Pages (`/services`, `/services/[slug]`)**: Service overviews, session highlights, tailored FAQs, WhatsApp inquiry links, and structured Service JSON-LD.
- **Cinematography & Films (`/films`)**: Video showcase with VideoObject structured data.
- **About (`/about`), Testimonials (`/testimonials`), FAQ (`/faq`), and Contact (`/contact`)**: Dedicated editorial routes with inquiry submission (`/api/contact`) and spam/rate-limit protection.

---

## Admin Dashboard & CMS

All studio management views live under `/admin/*` and authenticate against `/api/auth/*`:

- **Dashboard (`/admin`)**: Overview metrics, quick counts, and database status (`/api/dashboard`).
- **Portfolio & Media (`/admin/gallery`, `/admin/films`, `/admin/services`, `/admin/brands`, `/admin/testimonials`, `/admin/video-testimonials`, `/admin/faqs`)**: Full CRUD management, drag-and-drop ordering, and direct media uploads.
- **Page & Identity Builders (`/admin/home`, `/admin/about`, `/admin/brand`, `/admin/theme`, `/admin/footer`, `/admin/settings`)**: Live editing for header/footer branding, colour themes, hero sections, studio copy, and multi-admin user management.
- **SEO & Social Metadata (`/admin/seo`)**: Manage page title/description defaults, canonical URL, keywords, Open Graph tags, Twitter/X card settings, Meta Pixel ID, and social preview imagery.
- **Google Drive Audit & Batch Importer**: Compare configured Drive folders against existing gallery records and R2 objects to import missing photography without duplicates (`/api/admin/drive-import`).
- **Storage & Security Tools (`/admin/storage`, `/admin/security`, `/admin/contacts`, `/admin/analytics`, `/admin/audit-logs`)**: Object storage inspection, R2 migration utilities, IP denylist management, session revocation, login access logs, and analytics dashboards.

---

## Media & Object Storage Pipeline

1. **Direct & Multipart Uploads**:
   - Standard files route through `/api/upload` or presigned direct uploads (`/api/upload/init` -> direct PUT -> `/api/upload/complete`).
   - Large videos and high-resolution sets support S3-style multipart uploads (`/api/upload/multipart`, `/api/upload/video`) with file-extension, MIME, and size validation (`src/lib/uploadConstants.ts`).
2. **Unified Media Proxy (`/api/media/[...path]`)**:
   - Supports `GET`, `HEAD`, and `OPTIONS` without requiring authentication so visitors and social crawlers can fetch images reliably.
   - Reads objects from Cloudflare R2, supports HTTP `Range` requests for video playback, and serves optional `?w=` and `?q=` resized WebP variants cached in memory via `sharp`.
   - Falls back gracefully to local assets in `/public` or legacy database media records if needed during storage recovery.
3. **Public Assets (`/public`)**:
   - `public/icon.jpeg`: Original full-colour brand artwork (`1046 x 1000`, sRGB JPEG).
   - `public/favicon.ico`, `public/icon.png`, `public/apple-touch-icon.png`, `public/site.webmanifest`: Browser tab, bookmark, and web app manifest icons.
   - `public/robots.txt`: Crawler rules explicitly permitting indexing of public pages and `/api/media/` while disallowing `/admin/` and private `/api/` endpoints.

---

## SEO, Brand Logos & Social Sharing

- **Single Source of Truth for Social Previews**:
  - `src/lib/seoMetadata.ts` and `src/lib/seoConfig.ts` read the Admin Panel SEO record (`SEO` collection) dynamically across the root layout (`/`) and every public route (`/about`, `/services`, `/services/[slug]`, `/gallery`, `/films`, `/testimonials`, `/faq`, `/contact`).
  - Both Open Graph (`og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt`) and Twitter/X (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) derive directly from the Admin Panel's configured `ogImage` and `twitterImage` URLs.
  - `inspectSeoImage` uses `sharp` to inspect the actual uploaded image format and pixel dimensions rather than hardcoding mismatched dimensions, and surfaces an explicit server error if the Admin OG image is missing or unreachable instead of falling back to a favicon or monochrome icon.
- **Brand Logos & Structured Data**:
  - `FloatingNavbar`, `LuxuryFooter`, and `Preloader` consume the live `BrandSettings` logo configured in Admin Brand Settings and fall back cleanly to editorial typography when unset.
  - JSON-LD schemas (`src/lib/schema.ts`, `src/components/layout/StructuredData.tsx`) receive the resolved live brand logo and Open Graph image URLs.

---

## Authentication & Security Controls

- **Admin Route Protection**:
  - Page navigation under `/admin/*` (excluding `/admin/login`) is guarded in `src/proxy.ts` via signed JWT verification on the `auth_token` HTTP-only cookie.
  - Admin and mutation API handlers call `requireAdmin` (`src/lib/cmsDatabase.ts`), which verifies JWT signatures, checks role (`admin`), enforces session generation (`authGeneration` revocation support), and verifies account active/unblocked status against MongoDB.
- **Rate Limiting & Network Controls**:
  - Sliding-window rate limiting (`src/lib/rateLimit.ts`) protects login, password reset, contact submission, AI concierge chat, and upload endpoints.
  - IP denylist enforcement (`src/lib/security.ts`) logs blocked access attempts and returns HTTP `403`.
- **Frontend Boundary**:
  - All database drivers, object storage SDK clients, signing secrets, server Drive folder configurations (`src/lib/driveFoldersConfig.ts`), and AI client calls remain strictly on the server and are never imported into `'use client'` modules or public client bundles.

---

## Project Structure

```text
├── public/                 # Static icons, web manifest, verification files, robots.txt
├── src/
│   ├── app/
│   │   ├── about/          # About page + dynamic metadata
│   │   ├── admin/          # Authenticated Studio CMS pages
│   │   ├── api/            # Route Handlers (auth, CMS CRUD, media proxy, uploads, chat, analytics)
│   │   ├── contact/        # Inquiry page
│   │   ├── faq/            # FAQ page
│   │   ├── films/          # Cinematography page
│   │   ├── gallery/        # Portfolio gallery page
│   │   ├── services/       # Services index & dynamic [slug] pages
│   │   ├── testimonials/   # Client reviews & video testimonials
│   │   ├── layout.tsx      # Root layout, fonts, JSON-LD, Meta Pixel, global metadata
│   │   ├── page.tsx        # Homepage & dynamic SEO metadata
│   │   ├── robots.ts       # Dynamic robots metadata route
│   │   └── sitemap.ts      # Dynamic XML sitemap
│   ├── components/
│   │   ├── admin/          # CMS editors, MediaUploader, GoogleDriveImportModal
│   │   ├── analytics/      # AnalyticsTracker & MetaPixel scripts
│   │   ├── layout/         # Navbar, Footer, ServerDataProvider, StructuredData
│   │   ├── sections/       # Editorial landing & page sections
│   │   └── seo/            # JsonLd renderer
│   ├── hooks/              # Client hooks (site config, theme, media preload)
│   ├── lib/                # Database, R2, auth, security, schema, SEO & storage helpers
│   ├── models/             # Mongoose schemas
│   └── types/              # Shared TypeScript definitions
├── next.config.ts          # Image remote patterns, proxy/body limits, noindex API headers
├── package.json            # Dependencies and build scripts
└── tsconfig.json           # TypeScript compiler configuration
```

---

## Local Setup, Development & Deployment

### Prerequisites

- Node.js 20+ and npm
- MongoDB Atlas cluster (or local MongoDB instance)
- Cloudflare R2 bucket and API credentials (for cloud media storage and uploads)

### Installation

```bash
npm install
```

Configure the required database connection, session signing secret, Cloudflare R2 storage credentials, and optional third-party service keys in your hosting provider's secret manager or local runtime configuration before starting the application.

### Development Server

```bash
npm run dev
```

Runs the Next.js development server on port `3000`.

### Quality Checks & Production Build

```bash
npx tsc --noEmit
npm run lint
npm run build
npm start
```

### Deployment

- Optimized for Vercel (Next.js App Router, Node.js runtime API routes, `sharp` native image processing, and `next.config.ts` server body limits).
- Configure all runtime credentials in the deployment project settings and deploy from the `main` branch.

---

## Verification & Troubleshooting

- **Social Link Previews Show Stale or Old Images**:
  - Verify the active Open Graph and Twitter image in `/admin/seo` points to a valid `/api/media/...` or HTTPS asset without falling back to a favicon.
  - Request `/api/media/...` directly to confirm HTTP `200`, accurate image MIME headers, and full-colour rendering.
  - After deploying updates, force Meta/WhatsApp crawlers to re-scrape via the Meta Sharing Debugger so cached preview thumbnails refresh.
- **Media Upload or Storage Diagnostics**:
  - Inspect Cloudflare R2 connectivity and bucket object counts in `/admin/storage` or `/admin/security`.
  - Confirm uploaded image extensions and file sizes stay within configured image and video limits.
