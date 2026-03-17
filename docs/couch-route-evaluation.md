# Couch Route Runtime Evaluation

This note describes what executes when a user visits `/couch`.

## Route entry

- `AppContent` registers `Route path="/couch"` to render `CouchPage`.
- `AppContent` also computes `isCouchMode` from URL query/local storage/user agent and runs a guard that redirects `/?couch=true` users back to `/couch` only when they land on `/`.

## What `CouchPage` does on mount

1. Injects Google Cast Receiver SDK script (`cast_receiver_framework.js`) into `<head>` if missing.
2. Enables persistent couch mode (`localStorage.fmn_couch_mode = 'true'`).
3. Attempts to initialize CAF receiver context:
   - immediately once,
   - then every 400ms up to 20 retries.
4. If CAF starts, navigates to `/?couch=true` (replace history) after 300ms.
5. If CAF never appears, logs warning and still navigates to `/?couch=true`.

## What runs after redirect to `/?couch=true`

- `isCouchModeEnabled()` returns `true` due to query param and/or persisted local storage.
- `Layout` switches to couch-mode UI (hides normal header/navigation and shows pulse notification + exit hatch).
- `useFirebaseData()` keeps Couch/Pulse Firestore listeners active even when unauthenticated so TV receiver can mirror state.
- App-level sync effect listens to `metadata/couch` updates and navigates TV to `couchState.path` when timestamp advances.

## Notable behavior and caveats

- Query parsing uses `search.includes('couch=true')` (not strict param parsing), so malformed query strings containing that substring will still enable couch mode.
- `/couch` is a bootstrap route: final viewing experience intentionally happens on `/?couch=true`.
- Even if Cast SDK fails to initialize, users are still forced into couch mode fallback UX.
