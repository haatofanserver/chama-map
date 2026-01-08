# Technology Stack

## Framework & Runtime
- **React 19** - UI library
- **TypeScript 5** - Type safety and development experience
- **Node.js 20+** - Runtime environment

## Build System & Deployment
- **Vite 6** - Fast build tool and development server
- **Static Site Generation** - Build outputs static files for hosting
- **Tailwind CSS 3** - Utility-first CSS framework
- **PostCSS** - CSS processing with Autoprefixer

## Core Libraries

### Map & Geospatial
- **Leaflet 1.9.4** - Interactive maps
- **React Leaflet 5.0.0** - React bindings for Leaflet
- **@turf/boolean-point-in-polygon** - Geospatial calculations

### State Management & Data
- **Redux Toolkit 2.8.2** - State management
- **React Redux 9.2.0** - React bindings for Redux

### Internationalization
- **i18next 25.3.2** - Internationalization framework
- **react-i18next 15.6.1** - React bindings for i18next
- **i18next-browser-languagedetector** - Automatic language detection

### UI & Animation
- **Framer Motion 12.23.0** - Animation library
- **React Icons 5.5.0** - Icon library

### Utilities
- **fflate** - Compression/decompression
- **@xmldom/xmldom** - XML parsing
- **striptags** - HTML tag removal
- **react-use-cookie** - Cookie management

## Development Tools
- **ESLint 9** - Code linting with TypeScript and React configs
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## Common Commands

```bash
# Development
npm run dev          # Start Vite development server
npm run build        # Build for production (static files)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint

# Package Management
npm install          # Install dependencies
npm ci              # Clean install from lock file
```

## Environment Variables
- `VITE_SITE_URL` - Production domain for social media meta tags
- `VITE_BASE_PATH` - Base path for subdirectory deployments
- `VITE_CORS_PROXY` - CORS proxy for external images

## Build Configuration
- Static build outputs to `dist/` directory
- Code splitting with manual chunks for vendor libraries
- Path aliases configured (`@/` → `./src/`)
- Custom type definitions in `@types/` directory
- Hot module replacement in development