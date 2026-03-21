# PWA Branding & Sync Skill

## Overview
This skill ensures that the "Pizza Movie Night" brand is consistently applied across the Progressive Web App manifest, iOS metadata, and image assets.

## Audit Checklist
Whenever updating the app logo or name:
1.  **Vite Manifest**: Check `vite.config.ts` for:
    -   `name`: Global descriptive name.
    -   `short_name`: Display name under the home screen icon.
    -   `theme_color`: System status bar color (match the theme background).
2.  **HTML Metadata**: Check `index.html` for:
    -   `<meta name="apple-mobile-web-app-title">`: Matches `short_name`.
    -   `<meta name="application-name">`: Matches `name`.
    -   `<meta name="theme-color">`: Matches `theme_color`.
3.  **Asset Generation**: 
    -   Generate a 512x512 logo.
    -   Overwire `public/pwa-192.png` and `public/pwa-512.png`.
    -   Overwrite `public/favicon.ico` (can use the same PNG).

## Icon Guidelines
- Use a safe zone (padding) for Android maskable icons.
- Ensure high contrast for Luminous (light) and Pinnacle (dark) themes.
- No text in icons (Android and iOS auto-render labels).
