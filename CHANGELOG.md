# Changelog

All notable changes to this project will be documented in this file.

## [0.9.0] - 2026-03-09

### Added
- **Couch Mode (Native Casting)**: Fully implemented a native Google Cast integration. Users can now launch the app directly to a Chrome/Google/Samsung Smart TV.
- **Instant Mirroring**: Hand-built a Firestore-driven real-time synchronized state. Navigation and view modes are instantly shared between the phone and the TV.
- **Cinematic TV UI**: Added a widescreen-optimized, non-interactive visual mode when the app is rendered on a TV (hides headers, navigation, buttons, and fixes the filter bar layout).
- **Fallback Media Stream**: Added a dynamic image broadcasting feature for the default Cast receiver when a custom app ID has not been provided. 
- **AI Party Pack Integration**: Upgraded to the `gemini-flash-latest` model for improved and faster AI content generation. 

### Changed
- **Navigation Controls**: Moved the `CastButton` to the global header navigation for immediate accessibility.
- **Unified Controls**: Consolidated display options and visual settings (List/Grid switch, Filtering, Search, and Themes) into a central contextual navigation bar on the `MovieList` page.
- **Search Re-ranking**: Enforced deterministic exact-title sorting overriding fuzzy TMDB match results (Crucial for movies like `WALL·E`).

### Fixed
- Fixed trailing edge case UI issues involving touch-delay on mobile Safari.
- Resolved trailing navigation issues with the `MovieDetailPage` related to real-time sync states.
- Handled visual bugs related to long strings overrunning the filter chips on small mobile viewports.
