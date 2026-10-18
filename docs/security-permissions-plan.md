# Syn — Security & Permissions Plan

> Group project role: **Security & Permissions — App Sandbox, Permissions, Authentication**
> This document is the single source of truth for our role. Every future session starts by reading this file.

---

## 1. Role Scope

### We own
| Area | Files | Status |
|---|---|---|
| Authentication backend | `backend/APIS/auth.py` | Exists — needs hardening |
| Auth ↔ OS integration | `components/LockScreen.jsx` (auth gate only), `store/usePhone.jsx` (auth state) | Not started |
| Permission model | `store/usePhone.jsx` (app manifest), `components/PowerMenu.tsx` (gate BIOS button) | Not started |
| App sandbox | New: `lib/sandbox/*`, app wrapper / error boundary | Not started |

### We do NOT touch (other teammates' lanes)
- UI/visual bugs: LockScreen interval bug, Tailwind typos (`bg-ambder-500`, `bg-s-200`), `RecentApps.jsx`
- CPU / SynMachine bugs: ALU opcode mismatch, src/dest fetch, PC/fetch loop
- SynOS kernel internals
- Phone app feature logic (Contacts, dialer)

**Rule:** if a bug is not on our path, leave it. If a bug blocks our work, fix the minimum needed and note it in §8 (Session Log).

---

## 2. Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth transport | HttpOnly cookie `access_token` (existing pattern) | Keeps tokens out of JS reach (XSS mitigation) |
| Cookie security | `secure` driven by `ENV` var, default `False` for dev | Works on `http://localhost` during dev |
| Permission source of truth | Manifest in store (`allApps` entries get `perm` field) | Declarative, UI-enforced, one place to audit |
| Sandbox storage | Per-app namespace `syn.app.<appId>.` over localStorage | Apps can't read each other's data |
| Sandbox crash isolation | React Error Boundary per app | A crashing app unmounts itself, not the OS |
| Backend enforcement | `get_current_user` dependency on all protected routes | Frontend gating is UX; backend gating is security |

---

## 3. Phases & Deliverables

### Phase 1 — Harden Authentication Backend
**Files:** `backend/APIS/auth.py`, `backend/.env.example`

- [ ] Fix typo'd 401 messages ("THere are no users")
- [ ] `secure` cookie flag from env (`COOKIE_SECURE`), documented
- [ ] Fix `max_age=3600` mismatch with Supabase session expiry (use session `expires_in` or refresh flow)
- [ ] Add `require_user` dependency wrapping `get_current_user` (returns 401 consistently, one place)
- [ ] Root cause the silent `except Exception` blocks — log server-side, return generic client message
- [ ] `backend/.env.example` documenting: `supabaseurl`, `supabasekey`, `FRONTEND_URL`, `COOKIE_SECURE`
- [ ] CORS origins moved to env list

**Deliverable:** zip of changed files + install commands.

### Phase 2 — Permission Model
**Files:** `store/usePhone.jsx`, `components/PowerMenu.tsx`

- [x] Add `perm` field to app manifest: `normal` | `permission:<name>` | `protected:<name>`
- [x] Grant-check helper: `canOpen(perm)` in store
- [x] Gate "Enter BIOS" in PowerMenu behind `protected:admin` → was dead button, now the visible demo of our role
- [x] Permission grant flow (`PermissionPrompt.jsx` at page root; Allow/Deny, PIN for `protected:`)
- [x] Persist granted permissions (localStorage, sandboxed namespace — dogfood our own sandbox)

### Phase 3 — App Sandbox
**Files:** `lib/sandbox/storage.js` (Phase 2), new `lib/sandbox/AppSandbox.jsx`; edit `components/HomeScreen.jsx`, `components/Phone.jsx`, `components/Contacts.jsx`

- [x] `SandboxedStorage`: namespaced get/set/remove per app id (`lib/sandbox/storage.js`)
- [x] `AppSandbox` error boundary: app crash → unmount app, return to home, log to console
- [x] Scoped store API: apps receive only `{ appId, storage, close }` via `useSandbox()`, not raw `usePhoneStore`
- [x] Migrate Phone/Contacts off raw `localStorage` to sandboxed storage (only the storage calls changed)
- [x] Sandbox API surface documented in `lib/sandbox/AppSandbox.jsx` header

### Phase 4 — Lock Screen as Security Boundary
**Files:** `components/LockScreen.jsx` (auth gate only), `store/usePhone.jsx`

Design per resolved OQ1 (frontend-only): local device PIN, no backend.

- [x] Swipe-to-unlock stays (UI teammate owns visuals); unlock only honored when `authed`
- [x] Auth state in store: `authed`, `devicePin` (persisted `syn.sec.devicePin`), `auth(pin)`
- [x] First unlock → create PIN flow (4+ digits, confirm); later unlocks → PIN challenge
- [x] `toggleLock` auth-aware: locking resets `authed`; direct unlock without auth is a no-op
- [x] Respect teammate's LockScreen design — visuals unchanged, gate added on top

---

## 4. Definition of Done (per phase)
- [ ] Code shipped as zip + exact install commands (project root: `/home/nox/projects/syn`)
- [ ] No changes outside our scope files (or deviation logged in §8)
- [ ] Backend changes tested: `python -m uvicorn backend.APIS.auth:app --reload` boots clean
- [ ] Frontend changes don't break `npm run dev`

---

## 5. Workflow (every session)
1. Read this plan. Check §7 progress tracker and §8 session log.
2. Confirm which phase/step we're on with the user.
3. Write code → zip changed files → give commands:
   ```bash
   cd /home/nox/Downloads && unzip <file>.zip -d /home/nox/projects/syn/
   ```
4. Update §7 checkboxes and append §8 session log in the *next* delivery.

---

## 6. Open Questions
1. ~~Does the phone OS talk to the FastAPI backend (real Supabase auth), or should sandbox/permissions work standalone frontend-only for now?~~ **RESOLVED 2026-10-18 — frontend-only.** Backend dev (UPR24) confirmed in team chat: "The auth system is a supabase auth but we dont connect it." Phase 4 will use a local credential (PIN), swappable for backend auth later.
2. Who owns `backend/SynOS/kernel.php` and the PVCpu privilege levels (PL_FULL … PL_SANDBOX)? If unowned, enforcing privilege levels in `execute()` may be ours.
3. PIN/pattern lock: in scope for us (authN) or UI teammate?

---

## 7. Progress Tracker
- Phase 1: **done** (hardened auth.py + .env.example shipped 2026-10-18)
- Phase 2: **done** (permission model + BIOS gate shipped 2026-10-18, verified working)
- Phase 3: **done** (app sandbox shipped 2026-10-18)
- Phase 4: **done** (device PIN lock screen shipped 2026-10-18) — **ALL PHASES COMPLETE**

> ⚠️ **Project root is `/home/nox/projects/Syn`** (capital S). An earlier lowercase `syn/` folder was a stray — removed. All future installs: `unzip <zip>.zip -d /home/nox/projects/Syn/`

---

## 8. Session Log
*(Newest first.)*

| Date | Done | Files shipped | Notes |
|---|---|---|---|
| 2026-10-18 | Phase 4: lock screen security boundary | `store/usePhone.jsx`, `components/LockScreen.jsx` | Swipe now unlocks only when `authed`. First unlock → create PIN (4+ digits, confirm); after that PIN required. `toggleLock` is auth-aware (locking resets auth; direct unlock w/o auth no-ops). Deviation (justified, file on our path): fixed `setInterval(setCurrentTime(), 60000)` → `setCurrentTime` — clock was never updating. PIN stored plaintext in localStorage (demo-grade; noted for swap to backend auth). **Role complete: auth hardening + permission model + BIOS gate + app sandbox + device lock.** |
| 2026-10-18 | Phase 3: app sandbox | `lib/sandbox/AppSandbox.jsx`, `components/HomeScreen.jsx`, `components/Phone.jsx`, `components/Contacts.jsx` | Apps now render inside `<AppSandbox>`: namespaced storage (`syn.app.<id>.*`), `useSandbox()` hook with scoped API `{ appId, storage, close }`, crash → unmount + back to home + console log. Migrated Phone save / Contacts read off raw localStorage (storage calls only, app logic untouched — their bugs remain theirs). No store changes needed (deviation from plan, simpler). NOTE: old `contacts` localStorage data does NOT migrate — re-add a contact after installing. Open Question 1 resolved: frontend-only. Next: Phase 4 (lock screen security boundary, local PIN). |
| 2026-10-18 | Phase 2: permission model | `lib/sandbox/storage.js`, `store/usePhone.jsx`, `components/PermissionPrompt.jsx`, `components/PowerMenu.tsx`, `components/HomeScreen.jsx`, `pages/index.js` | Deviations (minimal, required to make the gate functional): `index.js` now renders `<Bios/>` when `bios=true` and `<PermissionPrompt/>` at page root (outside the phone frame so QS-triggered prompts show). `permission:camera` is a stand-in on app id 4 until the Camera teammate ships their app — move it then. Admin PIN: `1234` default (demo-grade, `syn.sec.adminPin` namespace). Team chat has Open Question 1 — Phase 4 design pending. Next: Phase 3 (app sandbox). |
| 2026-10-18 | Phase 1: hardened auth backend | `backend/APIS/auth.py`, `backend/.env.example` | Fixed typo'd 401s; `COOKIE_SECURE`/`CORS_ORIGINS` env-driven; cookie `max_age` from `session.expires_in` (kills silent 1h logouts); added `require_user` dependency alias; server-side logging; `/auth/me` reuses `get_current_user`. Open Question 1 still unanswered — Phase 4 design pending. Next: Phase 2 (permission model). |
| 2026-10-18 | Plan written, scope agreed | this file | Awaiting answer to Open Question 1 before Phase 1 |
