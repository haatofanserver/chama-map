# Project Structure

## Root Directory
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `index.html` - HTML entry point with meta tags
- `tsconfig.json` - TypeScript configuration with path aliases
- `tsconfig.node.json` - TypeScript config for Vite
- `eslint.config.mjs` - ESLint configuration
- `.prettierrc` - Code formatting rules
- `postcss.config.mjs` - PostCSS/Tailwind configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.env.example` - Environment variables template

## Source Code (`src/`)

### Main Application
- `main.tsx` - React entry point and root rendering
- `App.tsx` - Main application component with providers and routing
- `app/globals.css` - Global styles and Tailwind imports

### Components (`src/components/`)

#### Map Components (`src/components/map/`)
- `JapanMap.tsx` - Main map component with Leaflet integration
- `MapEventHandler.tsx` - Map event handling logic
- `MapStyles.tsx` - Dynamic map styling
- `PrefecturePopup.tsx` - Prefecture information popup
- `TrackMarker.tsx` - Individual location markers
- CSS modules for component-specific styles

#### Providers (`src/components/providers/`)
- `StoreProvider.tsx` - Redux store provider
- `TranslationProvider.tsx` - i18next provider

#### UI Components (`src/components/ui/`)
- `DynamicMetadata.tsx` - Client-side meta tag updates
- `SplashScreen.tsx` - Loading screen component
- `InfoPanel.tsx` - Information sidebar
- `LanguageSelector.tsx` - Language switching
- `FloatingArrowButton.tsx` - UI controls
- Other utility UI components

### Hooks (`src/hooks/`)
- `useMapRefs.ts` - Map reference management

### State Management (`src/lib/`)
- `store.ts` - Redux store configuration
- `slices/` - Redux Toolkit slices for different features
- `hooks.ts` - Typed Redux hooks
- `i18n.ts` - Internationalization setup
- `SmoothWheelZoom.js` - Custom map interaction

### Services (`src/services/`)
- `api.ts` - Data fetching functions

### Types (`src/types/`)
- `map.ts` - TypeScript interfaces for map data

### Utilities (`src/utils/`)
- `groupTrackFeatures.ts` - Track data processing
- `mapPrefectureUtils.ts` - Prefecture-related utilities
- `mapStyles.ts` - Map styling functions

## Public Assets (`public/`)
- `data/` - GeoJSON files and images
- `locales/` - Translation files (en/ja)
- PWA assets and icons
- Static assets served directly

## Type Definitions (`@types/`)
- Custom TypeScript definitions
- Extensions for third-party libraries

## Naming Conventions
- **Components**: PascalCase (e.g., `JapanMap.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMapRefs.ts`)
- **Utilities**: camelCase (e.g., `mapStyles.ts`)
- **Types**: PascalCase interfaces (e.g., `TrackProperties`)
- **CSS Modules**: Component name + `.module.css`

## Import Patterns
- Use `@/` alias for src imports
- Relative imports for same-directory files
- React.lazy() with Suspense for code splitting
- Type-only imports where appropriate

## File Organization Principles
- Group by feature/domain (map, ui, providers)
- Separate concerns (components, hooks, utils, types)
- Co-locate related files (component + styles)
- Keep utilities pure and testable

## Environment Variables
- Use `VITE_` prefix for environment variables
- Access via `import.meta.env.VITE_VARIABLE_NAME`
- Define in `.env` files or deployment environment