# Join + Dashboard Library integration TODO

- [ ] Update `src/routes/join.$id.tsx` to connect to SignalR (`CAPTION_HUB_URL`) and join/leave session groups.
  - [ ] Keep the existing demo UI as a fallback (keep `demoCaptions` and simulation logic but only use when SignalR isn’t available / session id invalid).
  - [ ] When SignalR is connected, subscribe to `ReceiveCaption`, normalize payload, and append/replace captions.
  - [ ] Preserve bookmarks/reactions/questions UI.

- [ ] Update `src/routes/dashboard.library.tsx` to fetch real ended sessions via `fetchSessions`.
  - [ ] Keep demo sessions fallback while API loads/fails. Display 

- [ ] Verify routing artifacts (no manual edit to `routeTree.gen.ts`).
  - [ ] Run frontend typecheck/build to ensure `/join/$id` and `/dashboard/library` compile.

- [ ] Smoke test in browser:
  - [ ] `/join` navigates to `/join/:id`.
  - [ ] Listener receives live captions from `/sessions/:id`.
  - [ ] Library page shows ended sessions (API) and works with demo fallback.

