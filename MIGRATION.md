# Next.js to React + Vite Migration

This document outlines the migration from Next.js 15 to React 19 + Vite 6.

## What Changed

### Build System
- **Removed**: Next.js 15.3.5, Turbopack, `@tailwindcss/postcss`
- **Added**: Vite 6.0.7, standard Tailwind CSS 3.4.17, Autoprefixer

### Project Structure
- **Removed**: `src/app/layout.tsx`, `src/app/page.tsx`, `next.config.ts`
- **Added**: `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `index.html`
- **Moved**: Static assets from `src/app/` to `public/`

### Dependencies
- **Removed**: `next`, `eslint-config-next`, `@eslint/eslintrc`, `@tailwindcss/postcss`
- **Added**: `@vitejs/plugin-react`, `@typescript-eslint/*`, `eslint-plugin-react-*`, `globals`

### Code Changes
- Removed all `'use client'` directives
- Replaced `next/dynamic` with `React.lazy()` and `Suspense`
- Replaced `next/image` with regular `<img>` tags
- Replaced `next/font/google` with Google Fonts CDN links
- Updated environment variables from `NEXT_PUBLIC_*` to `VITE_*`
- Updated environment variable access from `process.env.*` to `import.meta.env.*`

### Configuration Updates
- **TypeScript**: Updated for Vite, removed Next.js plugin
- **ESLint**: Switched from Next.js config to React + TypeScript config
- **PostCSS**: Updated for standard Tailwind CSS
- **Tailwind**: Added standard configuration file

## Environment Variables

Update your environment variables:
- `NEXT_PUBLIC_SITE_URL` → `VITE_SITE_URL`
- `NEXT_PUBLIC_BASE_PATH` → `VITE_BASE_PATH`
- `NEXT_PUBLIC_CORS_PROXY` → `VITE_CORS_PROXY`

## Commands

| Next.js | Vite |
|---------|------|
| `npm run dev` | `npm run dev` |
| `npm run build` | `npm run build` |
| `npm run start` | `npm run preview` |
| `npm run lint` | `npm run lint` |

## Benefits

1. **Faster Development**: Vite's HMR is significantly faster than Next.js dev server
2. **Simpler Setup**: No framework-specific patterns, just React
3. **Better Tree Shaking**: Vite's build optimization is more aggressive
4. **Smaller Bundle**: Removed Next.js runtime overhead
5. **More Control**: Direct control over build process and optimization

## Migration Steps Completed

1. ✅ Updated package.json with new dependencies
2. ✅ Created Vite configuration
3. ✅ Created HTML entry point with meta tags
4. ✅ Created React entry point (main.tsx)
5. ✅ Converted layout and page to App.tsx
6. ✅ Updated all components to remove Next.js dependencies
7. ✅ Updated TypeScript configuration
8. ✅ Updated ESLint configuration
9. ✅ Updated PostCSS and Tailwind configuration
10. ✅ Moved static assets to public directory
11. ✅ Updated environment variable usage
12. ✅ Updated steering documents

## Next Steps

1. Run `npm install` to install new dependencies
2. Update your deployment configuration for static hosting
3. Update environment variables in your deployment environment
4. Test the application thoroughly
5. Update any CI/CD pipelines to use new build commands