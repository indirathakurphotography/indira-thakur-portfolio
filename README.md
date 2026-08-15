# Indira Thakur Photography — Final Upload Package

This package contains all prior FAQ and Gallery updates, plus the final release fixes below.

## 1. Instagram links
- Public Instagram Reel and post URLs are validated in Admin.
- URLs are transformed to correct native embed URLs for playback.
- Category matching supports Wedding/Weddings and Brand/Brand Collaboration variations.
- Admin create, upload and delete requests use the logged-in admin token.

## 2. SEO and AEO
- The page-specific FAQ content and visible matching FAQ structured data are included.
- Sitemap now includes Family, Brand and Corporate service URLs in addition to the existing service pages.
- Existing global metadata, robots and structured data are preserved.

## 3. First-click navigation
- Gallery category URL state no longer resets from stale search parameters after the first click.
- Service cards use Next.js Link navigation instead of a raw anchor.

## Upload steps
1. Extract this ZIP.
2. Copy the contents of src into the repository's existing src folder, replacing files when prompted.
3. In VS Code terminal run:
   git add src
   git commit -m "Finalize Instagram embeds, SEO AEO and navigation"
   git push origin main
4. Wait for deployment, then add one public Reel/Post URL in Admin → Instagram Links and verify it in the selected Gallery category.

Only public, embeddable Instagram URLs can play. Private or restricted Instagram posts cannot be embedded by Instagram.
