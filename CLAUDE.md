# CLAUDE.md — PreparadorMMA

> **Keeping this file current**: Update CLAUDE.md whenever you ship a change that affects any of the following — do it in the same commit as the code change:
> - Routing (new routes, removed routes, guard changes)
> - LocalStorage keys (added, removed, renamed, TTL changed)
> - Firestore schema (new fields, new collections, changed types)
> - New critical patterns or footguns discovered
> - Bugs fixed that fit the "Known Historical Bugs" table
> - Service responsibilities change significantly
> - Angular version bumps or major dependency changes
>
> The goal is that any AI assistant (or new developer) cloning the repo can read this file and immediately understand the non-obvious parts of the codebase. Keep entries factual and tied to the code — don't add aspirational notes about how things "should" work.

Angular tutoring app for Spanish civil engineering exams (MMA — Máster Medio Ambiente). Users practice questions by section/subsection and take timed, randomized exams. Google OAuth + Firestore backend. Live at https://tutoring-service.netlify.app/

---

## Essential Commands

```bash
npm start              # dev server at localhost:4200
npm run test:run       # single Vitest run (no watch)
npm test               # watch mode
npm run test:coverage  # coverage report (70% minimum required)
npm run pre-commit     # lint + tsc + tests — run before pushing
npm run lint           # ESLint with auto-fix
npm run tsc:check      # TypeScript type check only
npm run build:prod     # production build
```

---

## Architecture Overview

### Why Standalone Components (No NgModules)

Angular 20 project. There is no `app.module.ts`. Every component declares its own `imports: [...]`. This is intentional — it makes dependency trees explicit and avoids the "which module is this in?" problem. When creating new components, add all required imports to the component's own `imports` array, never look for a shared module.

### Two Distinct Use Modes

The app has two separate flows with very different requirements:

1. **Practice mode** (`/home`) — user picks a subsection, answers one question at a time, sees immediate right/wrong feedback. Firestore real-time subscriptions are appropriate here because the question set is small and feedback is per-question.

2. **Exam mode** (`/exam-configuration` → `/test`) — user configures a timed exam, questions are randomly selected once, no feedback shown until the exam ends. **Firestore subscriptions here must be one-shot** (`take(1)`). See Critical Patterns below.

### State Ownership

| State | Where stored | TTL |
|---|---|---|
| Current exam questions | Component memory (`filteredQuestions[]`) | Component lifetime |
| Answer tracking (blank/correct/incorrect per section) | `TestService.correctAnswers` + `localStorage:testServiceState` | 12h |
| Answered question IDs → selected answer | `TestService.answeredQuestions` Map + `localStorage:answeredQuestions` | 12h |
| Exam configuration | `TestService.customConfiguration` + `localStorage:customExamConfiguration` | **1h** |
| Auth session | Firebase Auth + cookie `userData` + `localStorage:sessionExpiration` | 8h |
| User progress history | Firestore `users/{uid}/progress` subcollection | permanent |

The 1-hour TTL on `customExamConfiguration` is intentional for security — if someone leaves an unfinished exam and returns hours later, they should reconfigure. However, within an active session the in-memory `customConfiguration` remains valid regardless.

---

## Firestore Schema & Relationships

### `questions` collection (flat, no subcollections)

```typescript
{
  id: string              // Firestore auto-generated doc ID
  questionText: string
  questionIndex: number   // legacy ordering field, not used for randomization
  answers: [{ id: string, text: string }]  // typically 4 options
  correctAnswer: string   // matches one of answers[].id
  explanation: string     // shown after answer in practice mode
  mainSection: string     // 'administrativo' | 'medio ambiente' | 'costas' | 'aguas'
  subSection: string      // free-text name matching constants/sections.ts
  subSectionIndex: number // position within the mainSection's subsection list
}
```

**Important**: `mainSection` values are always lowercase and exact — the filtering logic does case-sensitive equality checks. `subSection` values historically had case/whitespace inconsistencies; a fix was added (commit 3099fa8) to normalize comparisons. If subsection filtering seems broken, check casing.

### `accounts` collection (one doc per Google user, keyed by UID)

```typescript
{
  email: string
  displayName: string
  photoURL: string
  admin: boolean    // admin role — checked by AdminGuard
  createdAt: Timestamp
  lastLogin: Timestamp
}
```

### `users/{userId}/progress` subcollection (one doc per completed exam session)

```typescript
{
  sessionId: string       // UUID generated at session start
  timestamp: Timestamp
  totalScore: number      // 0–100
  correctAnswers: number
  incorrectAnswers: number
  blankAnswers: number
  timeElapsed: number     // seconds
  sectionBreakdown: {
    [mainSection: string]: { correct: number, incorrect: number, blank: number }
  }
  configuration: {
    totalQuestions: number
    timeLimit: number
    sections: string[]
  }
}
```

**Relationship**: `accounts` and `users/{userId}/progress` both use the Firebase Auth UID as the key. There is no explicit foreign key — the UID is the join. `accounts` is created/updated on every login (see `auth.service.ts`). Progress docs are written when an exam is submitted.

---

## Critical Patterns & Footguns

### 1. `collectionData` is a real-time listener — always consider `take(1)` for exam context

`QuestionsService.getQuestions()` returns `collectionData(...)` from `@angular/fire/firestore`. This is a **persistent WebSocket-based listener** that re-emits every time the Firestore collection changes *and* every time the SDK reconnects (which happens automatically every ~30–60 minutes).

**Rule**: If a component needs questions for a one-time operation (exam randomization, displaying a fixed set), pipe with `.pipe(take(1))`. If it needs live updates (practice mode where the admin might add questions), use the raw subscription.

Current state:
- `test.component.ts` — uses `take(1)` ✅ (fixed in this codebase after a real production bug where the exam question set was re-randomized mid-exam at the ~30-60 min reconnect point)
- `home.component.ts` — uses live subscription (intentional, practice mode)

**If you add a new component that loads questions once, you must use `take(1)`.**

Without `take(1)`, the symptom is: mid-session, some answered questions remain (those whose IDs appeared in both the old and new random draw) but most questions silently swap to different ones. This is very hard to debug from user reports.

### 2. Authentication uses dual state: Firebase Auth + cookies

Auth state is maintained in two places simultaneously:
- **Firebase Auth** (server-validated, persisted via `browserLocalPersistence`)
- **Cookie `userData`** + `localStorage:sessionExpiration` (client-side, used for immediate state reads)

The `loginChanged` BehaviorSubject in `AuthService` is the source of truth for the UI. It is initialized from the cookie on service construction (before Firebase resolves), then updated by `onAuthStateChanged`. This means:
- If the cookie is missing but Firebase auth is still valid, `restoreSessionSilently()` re-creates the cookie without redirecting
- If Firebase auth is gone, `handleSessionExpired()` clears cookies and redirects to `/login`

**When debugging auth issues**: check both the cookie (`userData`) and whether `Firebase Auth` still has a current user. They can be out of sync during the ~1s window at startup.

### 3. The 30-minute inactivity timer fires during exams

`AuthService` sets a 30-minute inactivity timer based on mouse/keyboard activity. A user taking a long exam and reading without clicking will see a 60-second warning modal (`InactivityWarningModalComponent`), then be auto-logged-out.

This is a known UX tension. The activity events tracked are: `click`, `keypress`, `mousemove`, `scroll`, `touchstart`. Simply scrolling through exam questions resets the timer. Pure reading (no interaction) for 30+ minutes would trigger it.

If you modify exam-related components, make sure meaningful interactions (answering a question, advancing) still call `resetInactivityTimer()` via normal DOM events.

### 4. TestService scoring state must match the question set

`TestService.correctAnswers` tracks blank/correct/incorrect counts per section. These counts are initialized based on `QUESTIONWEIGHTS` (for full exams) or the custom `ExamConfiguration`. The blank count starts at the total number of questions and decrements as questions are answered.

**If you change question selection logic**, you must also update the initial counts in `TestService`. The `updateCustomQuestionCount()` method handles this for custom exams — `TestComponent` calls it after filtering questions. If the counts don't match the actual question set, the progress bar and final score will be wrong.

### 5. `subSection` string matching is normalized but fragile

Subsections are stored as free-text strings in Firestore. The canonical list is in `src/app/constants/sections.ts`. Filtering uses `.toLowerCase().trim()` comparison (added in commit 3099fa8). **When adding new questions, the `subSection` value must match the canonical name in `sections.ts` exactly (case-insensitively)**. Use the admin panel's dropdown rather than typing freehand.

---

## Key Service Responsibilities

### `TestService`

Owns all exam state. Key contract:
- Call `setCustomConfiguration(config)` *before* navigating to `/test`
- `TestComponent.ngOnInit()` calls `resetAllAnswers()` on entry, which resets scoring state
- `addClickedAnswer()` handles both first-time answers and answer changes — it adjusts blank/correct/incorrect counts correctly for all four cases (first correct, first wrong, change from wrong to right, change from right to wrong)
- State is auto-saved to localStorage after every answer via `saveState()`

### `AuthService`

Two lifecycles run in parallel:
1. **Session expiry monitoring**: checks cookie expiration every 5 minutes, auto-refreshes if <1h remaining and user was active in last 15 minutes
2. **Inactivity monitoring**: 30-minute idle timer, then 60-second warning, then `handleSessionExpired()`

`handleSessionExpired()` saves `returnUrl` to localStorage (but does NOT clear exam state) so users can re-authenticate and continue.

### `QuestionsService`

Thin wrapper over Firestore. Two methods:
- `getQuestions()` — full collection, real-time listener
- `getSpecificQuestions(mainSection, subSection)` — filtered query, real-time listener

Both return real-time observables. Apply `take(1)` at the call site when you need a snapshot.

### `ProgressService`

Writes to Firestore after exam completion. Reads historical sessions for the Results view. No in-memory cache — every read goes to Firestore.

---

## Question Selection Algorithm (Exam Mode)

When the user submits the exam configuration form:
1. `ExamConfiguration` is stored in `TestService` via `setCustomConfiguration()`
2. Navigation to `/test` happens
3. `TestComponent.ngOnInit()` calls `getQuestions().pipe(take(1))` to load all questions once
4. `filterQuestionsWithCustomConfig()` is called:
   - For each `selection` in the config (one per section the user chose):
     - Filter questions by `mainSection` and optionally by `subsections[]`
     - Shuffle (`sort(() => Math.random() - 0.5)`)
     - Take `selection.questionCount` from the shuffled list
5. Duplicate IDs are removed after combining all sections
6. `updateCustomQuestionCount()` is called to sync TestService scoring state with actual counts

The random shuffle uses `Math.random()`, so it's not cryptographically random — this is intentional and appropriate for an exam app.

---

## Frontend Code Patterns

### Component instantiation in tests

**No Angular TestBed is used.** Components are instantiated directly with `new ComponentName(mockService1, mockService2, ...)`. This is intentional — TestBed adds significant overhead and this project prefers fast, isolated unit tests.

```typescript
component = new TestComponent(
  mockQuestionsService as unknown as QuestionsService,
  mockTestService as unknown as TestService,
  mockAuthService as unknown as AuthService,
  mockRouter as unknown as Router
);
```

### Observable mocks

- Use `of(data)` for synchronous one-shot observables
- Use `new Subject<T>()` when you need to control emission timing (e.g., testing Firestore reconnect behavior)
- Use `new BehaviorSubject<T>(initial)` for services that expose a BehaviorSubject (like `testStatus`, `loginChanged`)

### Guard pattern

**`AuthGuard`** is Firebase's built-in guard from `@angular/fire/auth-guard`. It uses an async `authPipe` observable (`redirectUnauthorizedTo(['login'])`), so it resolves based on Firebase Auth state — not synchronously.

**`AdminGuard`** is custom (`src/app/guards/admin-guard.guard.ts`). It reads `AccountsService.isAdmin` (a BehaviorSubject), maps to `true` or a redirect to `/home`. The admin flag comes from the `accounts` Firestore collection, not from Firebase Auth claims.

On a cold page load, `AuthGuard` may briefly show a blank page while Firebase resolves. The cookie-based `loginChanged` in `AuthService` handles immediate UI state (showing/hiding nav), but it doesn't bypass `AuthGuard`.

---

## Sections & Question Weights (Full Exam)

Defined in `src/app/views/test/constants.ts`:

| Section | Questions |
|---|---|
| administrativo | 20 |
| medio ambiente | 25 |
| costas | 20 |
| aguas | 35 |
| **Total** | **100** |

Subsections are defined in `src/app/constants/sections.ts`. When adding new subsections, update both files.

---

## LocalStorage Keys Reference

| Key | Owner | Content | TTL |
|---|---|---|---|
| `testServiceState` | TestService | `{ correctAnswers, timestamp }` | 12h |
| `answeredQuestions` | TestService | `{ questions: [id, answer][], timestamp }` | 12h |
| `customExamConfiguration` | TestService | `{ config: ExamConfiguration, timestamp }` | **1h** |
| `sessionExpiration` | AuthService | Unix ms timestamp | matches cookie |
| `returnUrl` | AuthService | path string | cleared on use |
| `homeActiveSection` | HomeComponent | last active section | none |
| `progressSessionState` | ProgressService | session tracking state | cleared on logout |
| `progressTrackingEnabled` | ProgressService | `'true'` / `'false'` | cleared on logout |
| `progressTrackingUserId` | ProgressService | Firebase UID string | cleared on logout |
| `adminPanelActiveTab` | AdminPanelComponent | `'add-questions'` / `'database-maintenance'` | none |

---

## Testing Approach

- **Framework**: Vitest 3.2 with jsdom — no Karma, no Angular TestBed for unit tests
- **Pattern**: Direct instantiation with mocked dependencies
- **Firebase**: Never used in tests — always mock `QuestionsService`, `AuthService`, etc.
- **Coverage**: 70% minimum enforced in CI
- **Fixtures**: `src/testing/test-fixtures.ts` has `TestFixtures.createQuestion()`, `createUserInfo()`, etc.
- **Utilities**: `src/testing/test-utils.ts` has `FirebaseMocks` helpers for consistent service mocks

When testing time-dependent Firestore behavior (e.g., verifying a subscription only processes one emission), use `Subject` and call `.next()` manually rather than trying to fake timers.

---

## Routing

```
/login                    — public, Google OAuth
/home                     — AuthGuard, practice mode
/exam-configuration       — AuthGuard, configure exam
/test                     — AuthGuard, active exam (requires customConfig in TestService)
/results                  — AuthGuard, analytics history
/admin                    — AdminGuard + AuthGuard (single component with tabs)
```

**Admin panel is one route, not three.** `/admin` renders `AdminPanelComponent`, which contains tabs for "Add Questions" and "Database Maintenance" as embedded child components — not separate routes. Tab state persists in `localStorage:adminPanelActiveTab`.

`/test` will redirect to `/exam-configuration` if `TestService.getCustomConfiguration()` returns null. This is the guard against direct URL navigation.

---

## Deployment

- **Production**: Netlify, triggered by git tags (e.g., `v1.2.0`)
- **Preview**: Automatic for all PRs
- **Build**: `npm run build:prod` → `dist/tutoring-project/browser`
- **Firebase config**: baked into the bundle at build time from `environment.prod.ts` (not env vars)
- **CI**: lint → tsc → test coverage → dev build → prod build → security audit

---

## Known Historical Bugs

| Bug | Cause | Fix | Commit |
|---|---|---|---|
| Mid-exam question reset after ~30-60 min | `getQuestions()` subscription without `take(1)` re-randomized on Firestore reconnect | Added `.pipe(take(1))` in TestComponent | latest |
| Navigation buttons disappearing after long session | Cookie expired but Firebase auth still valid; local state went null | `restoreSessionSilently()` in `onAuthStateChanged` | 17b75c7 |
| Subsection filtering silently excluding questions | Case/whitespace mismatch between stored `subSection` and constants | `.toLowerCase().trim()` normalization | 3099fa8 |

---

**Maintainer**: Marc Luettecke — marc.luettecke1@gmail.com
**Angular**: 20 | **Node**: 20.19+ / 22.12+ / 24.3.0 | **Last updated**: March 2026
