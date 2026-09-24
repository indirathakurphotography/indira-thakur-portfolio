# Indira Thakur Photography

A bespoke portfolio and visual storytelling web platform for **Indira Thakur Photography**, an acclaimed luxury fine art photography studio based in Tilak Nagar, Chembur, Mumbai. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS, the platform delivers an editorial-grade digital experience showcasing fine art newborn, maternity, birth, family, and portraiture photography alongside cinematic documentaries.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Website Purpose](#website-purpose)
- [Main Website Sections](#main-website-sections)
- [Photography Services](#photography-services)
- [Key Features & Capabilities](#key-features--capabilities)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started / Development Setup](#getting-started--development-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Project Overview

Indira Thakur Photography is a premier luxury photography studio and visual storytelling practice founded by Indira Thakur. Combining a background in journalism and documentary visual capture with high-end fine art aesthetics, the studio specializes in capturing intimate, timeless milestones—from the gentle serenity of the first fourteen days of life to emotive maternity portraits, unscripted birth documentation, and multi-generational family heirlooms.

The web application serves as the studio's primary digital flagship: an immersive, editorial portfolio designed to convey elegance, warmth, and artistic authenticity while guiding prospective clients smoothly through commission inquiries.

---

## Website Purpose

The website is engineered to:

1. **Showcase Fine Art Portfolios**: Present high-resolution editorial galleries across multiple photography specialties with responsive masonry layouts and immersive lightbox viewing.
2. **Feature Cinematic Documentaries**: Highlight moving portraits, short films, and behind-the-scenes visual narratives.
3. **Facilitate Client Commissions**: Provide prospective clients with comprehensive service details, transparent session philosophies, pricing guidance, and a tailored inquiry/booking workflow.
4. **Publish Social Proof & Client Praise**: Share verified client testimonials, press features, and brand collaborations.
5. **Manage Studio Content Dynamically**: Provide a private, authenticated administrative CMS for gallery curation, media uploads (Cloudflare R2), Google Drive batch imports, SEO configurations, and brand asset management.

---

## Main Website Sections

The platform consists of dedicated, responsive pages and sections:

- **Home (`/`)**: Hero editorial presentation, curated highlight reels, featured gallery preview, philosophy overview, client praise carousel, press features, and primary booking calls-to-action.
- **About (`/about`)**: Biography of founder Indira Thakur, creative philosophy, journalistic foundation, studio heritage, and artistic journey.
- **Services (`/services` & `/services/[slug]`)**: Detailed commission offerings, session workflows, preparation guides, studio wardrobe information, and FAQs with deep-dive pages for each specialty.
- **Gallery (`/gallery`)**: Comprehensive, filterable fine art portfolio with instant category switching, responsive masonry grid, and fullscreen lightbox view.
- **Films (`/films`)**: Dedicated cinematography showcase featuring moving portraits, documentary birth reels, and family heritage films.
- **Testimonials (`/testimonials`)**: Curated client praise, verified reviews with client avatars, and press recognition.
- **FAQ (`/faq`)**: Structured knowledge base answering common client questions regarding booking timelines, wardrobe, hair & makeup, deliverables, and travel shoots.
- **Contact / Inquire (`/contact`)**: Interactive inquiry and commission reservation form tailored to session types, dates, and locations.
- **Admin Studio Portal (`/admin/*`)**: Authenticated management interface covering:
  - Media & Gallery curation (upload, reorder, tags, R2 integration)
  - Google Drive automated batch import pipeline with deduplication
  - Testimonial and client review moderation
  - Brand settings, studio logo, and favicon configuration
  - SEO metadata, Open Graph settings, and JSON-LD structured data controls

---

## Photography Services

The studio offers bespoke commissions across the following core disciplines:

| Service | Description |
| :--- | :--- |
| **Newborn Photography** | Gentle, peaceful storytelling captured within the baby's first 14 days of life using organic wraps, soft natural styling, and baby-led pacing. |
| **Maternity Photography** | Fine art pregnancy portraits celebrating expectant mothers, typically scheduled between weeks 24 and 28, with curated studio wardrobe and guided posing. |
| **Birth Photography** | Discreet, documentary-style birth storytelling capturing the raw emotion, strength, and sacred first moments of arrival. |
| **Family Photography** | Timeless multi-generational portraiture capturing genuine connection, laughter, and heirloom album creations. |
| **Baby & Milestone Photography** | Capturing sitter milestones, natural smiles, first steps, and first birthday celebrations. |
| **Films & Cinematography** | Editorial moving portraits and cinematic short documentaries documenting family legacies and motherhood journeys. |
| **Editorial & Corporate Portraiture** | Executive portraits, personal branding, and creative editorial commissions for founders and professionals. |

---

## Key Features & Capabilities

- **Editorial Design System**: Styled with luxury typography (Playfair Display, Inter, DM Mono) and a warm ivory palette (`#FAF8F5`) tailored to fine art aesthetics.
- **Responsive Visual Masonry**: High-performance gallery layout that dynamically adapts across mobile, tablet, desktop, and ultra-wide viewports.
- **Fullscreen Lightbox**: Immersive image viewer with keyboard navigation, touch swipe support, high-resolution rendering, and smooth exit animations.
- **Dual Media Pipeline (Cloudflare R2 & Local Fallbacks)**: High-speed asset delivery powered by Cloudflare R2 object storage with automatic local fallback resolution for seamless development and offline testing.
- **Google Drive Batch Import**: Admin integration allowing photographers to import entire shoot folders directly from Google Drive into Cloudflare R2 with automatic deduplication.
- **Advanced SEO & Structured Data (JSON-LD)**: Rich Schema.org integration covering `Organization`, `LocalBusiness`, `ProfessionalService`, `Person`, `WebSite`, `BreadcrumbList`, `Service`, `FAQPage`, and `ImageObject` schemas for search visibility.
- **Social Sharing & Open Graph Cards**: Pre-configured 1200x630 OpenGraph and Twitter summary cards, square multi-resolution favicons (16x16, 32x32, 48x48), Apple Touch icons (180x180), and Web App Manifest compliance.
- **Dynamic Brand Settings**: Real-time favicon, logo, and studio identity synchronization across client navigation and document heads.
- **Inquiry & Booking Flow**: Direct client contact pipeline integrated with WhatsApp direct messaging and contact form submissions.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) 15.3.3 (App Router, Server Components & Route Handlers)
- **UI & Runtime**: [React](https://react.dev/) 19.0.0
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.x (Strict type safety)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 3.4 with `@tailwindcss/typography`
- **Animation**: [Motion](https://motion.dev/) (Framer Motion 12.x) for luxury page transitions, fade-ins, and lightboxes
- **Icons**: [Lucide React](https://lucide.dev/)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) 0.33 for high-performance server-side image resizing and metadata generation
- **Object Storage**: [AWS S3 SDK](https://github.com/aws/aws-sdk-js-v3) (`@aws-sdk/client-s3`) configured for Cloudflare R2
- **External Integrations**: [Google APIs](https://github.com/googleapis/google-api-nodejs-client) (`googleapis`) for Google Drive batch asset import
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) 8.10
- **Authentication**: Firebase Client SDK & Next.js session validation for admin routes
- **Deployment Target**: [Vercel](https://vercel.com/) / Node.js Serverless Container

---

## Project Structure

```
├── public/                       # Static public assets
│   ├── icon.jpeg                 # Master uncropped studio brand logo
│   ├── icon.png                  # Square centered 512x512 PWA & Google icon
│   ├── apple-touch-icon.png      # Square 180x180 iOS touch icon with safe padding
│   ├── favicon.ico               # Multi-resolution browser favicon (16x16, 32x32, 48x48)
│   ├── logo.png                  # Transparent high-resolution brand logo
│   ├── og-image.jpg              # 1200x630 OpenGraph / Twitter preview card
│   └── site.webmanifest          # PWA web manifest configuration
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # Public client-facing routes
│   │   │   ├── about/            # About page
│   │   │   ├── contact/          # Inquire / Contact page
│   │   │   ├── faq/              # Frequently Asked Questions
│   │   │   ├── films/            # Cinematography showcase
│   │   │   ├── gallery/          # Filterable portfolio gallery
│   │   │   ├── services/         # Services directory & [slug] details
│   │   │   └── testimonials/     # Client praise & reviews
│   │   ├── admin/                # Authenticated studio administration portal
│   │   │   ├── brand/            # Brand identity & asset settings
│   │   │   ├── drive-import/     # Google Drive batch sync pipeline
│   │   │   ├── gallery/          # Portfolio image curation
│   │   │   ├── media/            # R2 media library manager
│   │   │   ├── testimonials/     # Review moderation
│   │   │   └── seo/              # SEO & metadata controls
│   │   ├── api/                  # Server Route Handlers
│   │   │   ├── brand/            # Brand settings endpoints
│   │   │   ├── media/            # Media serving and R2 fallback stream
│   │   │   └── ...               # Admin, gallery, and testimonial endpoints
│   │   ├── layout.tsx            # Root layout with fonts, metadata & JSON-LD
│   │   └── page.tsx              # Homepage
│   ├── components/               # React UI Components
│   │   ├── layout/               # Navbar, LuxuryFooter, DynamicHead, StructuredData
│   │   ├── sections/             # Page sections (Hero, Featured, Services, Praise)
│   │   ├── ui/                   # Reusable atomic UI elements (Buttons, Modals, Cards)
│   │   └── admin/                # Admin portal dashboard components
│   ├── lib/                      # Core utilities & database configurations
│   │   ├── mongodb.ts            # Mongoose database connection client
│   │   ├── r2Storage.ts          # Cloudflare R2 bucket integration
│   │   ├── seoConfig.ts          # Canonical metadata & keyword mappings
│   │   └── brandStorage.ts       # Studio brand settings & cache handlers
│   └── models/                   # Mongoose schemas (Gallery, Brand, Testimonial, SEO)
├── package.json                  # Dependencies & npm scripts
├── tailwind.config.ts            # Tailwind styling tokens & font configurations
└── tsconfig.json                 # TypeScript compiler options
```

---

## Getting Started / Development Setup

### Prerequisites

- **Node.js**: Version 18.18+ or 20+ (recommended)
- **Package Manager**: `npm` (v9+) or `pnpm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/indirathakurphotography/indira-thakur-portfolio.git
   cd indira-thakur-portfolio
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory based on the configuration below.

4. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Build for production:
   ```bash
   npm run build
   npm run start
   ```

---

## Environment Variables

Configure the following variables in your `.env.local` file for full feature access:

```env
# Application Base URL
NEXT_PUBLIC_SITE_URL=https://www.indirathakur.com

# Database (MongoDB)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/indira-thakur?retryWrites=true&w=majority

# Cloudflare R2 Object Storage (Media Delivery)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=indira-thakur-media
NEXT_PUBLIC_R2_PUBLIC_URL=https://media.indirathakur.com

# Google Drive Import Pipeline (Optional Admin Feature)
GOOGLE_DRIVE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Analytics & Pixels (Optional)
NEXT_PUBLIC_META_PIXEL_ID=1533647998184514
```

---

## Deployment

The application is optimized for deployment on **Vercel** or any standard Node.js serverless host:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node.js Version**: 20.x

---

## License & Studio Rights

All imagery, film content, artistic works, and brand identity materials are copyright © Indira Thakur Photography. All rights reserved. Code provided under standard studio proprietary license.
