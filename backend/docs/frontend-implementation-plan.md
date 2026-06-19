# Event Registration Frontend Implementation Plan

## Context Reviewed

This plan is based on:

- `docs/event-registration-product-spec.pdf`
- `docs/event-registration-product-spec.md`, used as the readable companion source because no PDF text extraction tool is available in this workspace.
- `docs/hoppscotch/event-registration-api.json`
- Backend source under `src/`, including routes, controllers, services, validators, repositories, middleware, seed data, and database migration.

The backend is an Express, TypeScript, PostgreSQL API with MVC-style separation. It exposes a public visitor registration workflow and a protected admin review workflow. There is no existing frontend in this repository, so the frontend should be added as a new React application without changing backend responsibilities.

## Product Scope

Build a complete frontend for an event registration system with:

- Public visitor registration page.
- Public success and error states after submission.
- Admin login.
- Authenticated admin dashboard.
- Request table with search, filters, sorting, pagination, archive visibility, and CSV export.
- Request detail view with notes, state changes, archive and unarchive actions, and audit history.
- State management screen for configurable request states.
- Statistics dashboard by state, major, and city.
- English and Arabic localization with correct RTL/LTR layout behavior.

Out of scope for the first frontend version:

- CMS for event content.
- Role-based permission matrix beyond current `admin` role.
- QR codes, tickets, payments, check-in, WhatsApp, and notifications.
- Editing request applicant fields, because the backend does not expose an update endpoint for those fields.

## Backend Contract Summary

Base API path: `/api`

Public endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check. |
| `POST` | `/api/registrations` | Submit a visitor registration. |

Auth endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Admin login. |
| `GET` | `/api/auth/me` | Current admin profile. |

Admin endpoints, all requiring `Authorization: Bearer <token>`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/requests` | List requests. |
| `GET` | `/api/admin/requests/:id` | Request detail. |
| `PATCH` | `/api/admin/requests/:id/state` | Change request state. |
| `POST` | `/api/admin/requests/:id/notes` | Add internal note. |
| `PATCH` | `/api/admin/requests/:id/archive` | Archive or unarchive request. |
| `GET` | `/api/admin/requests/export.csv` | Export filtered requests. |
| `GET` | `/api/admin/states` | List request states. |
| `POST` | `/api/admin/states` | Create request state. |
| `PATCH` | `/api/admin/states/:id` | Update request state. |
| `DELETE` | `/api/admin/states/:id` | Delete state, optionally transferring linked requests. |
| `GET` | `/api/admin/stats` | Dashboard statistics. |

Important backend behavior:

- New registrations are saved under `under_review`.
- Duplicate registrations are blocked by normalized phone or email.
- Full name must contain at least three words.
- Age bounds come from settings seeded as `18` to `100`.
- Default seeded states are `under_review`, `contacted_awaiting_approval`, `approved`, and `no_reply`.
- Request list rows use snake_case fields such as `request_number`, `full_name`, `state_slug`, `state_color`, and `created_at`.
- Validation errors use `{ error: { code, message, fields } }`.
- Duplicate errors use code `DUPLICATE_REGISTRATION` with `conflicts`.
- Expired, missing, or invalid auth returns `UNAUTHORIZED`.

## Recommended Frontend Stack

Use:

- React with TypeScript.
- React Compiler enabled in the Vite build so components benefit from automatic memoization where the code follows React's supported patterns.
- Vite for the frontend build tool.
- React Router for routing.
- Redux Toolkit for app state.
- RTK Query for API calls, caching, invalidation, loading states, and auth header injection.
- Tailwind CSS for styling.
- i18next with `react-i18next` for English and Arabic.
- GSAP for restrained page transitions, form success feedback, drawer/modal transitions, and dashboard number entrance.
- Lucide React for action, navigation, status, filter, export, archive, and settings icons.
- Vitest and React Testing Library for frontend tests.
- Playwright for critical end-to-end flows after the UI is implemented.

Reasoning:

- RTK Query fits the backend's REST contract and avoids duplicating request lifecycle logic in slices.
- React Router keeps public and admin flows explicit.
- React Compiler reduces manual memoization pressure, but components should still stay pure, deterministic, and TypeScript-safe.
- Tailwind gives fast, consistent styling without coupling UI rules to business logic.
- i18next is the right boundary for text, direction, and locale-specific labels.
- GSAP should enhance transitions only. Business state must remain in React and Redux.

## Project Placement

Recommended structure:

```text
frontend/
  index.html
  package.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  src/
    app/
      App.tsx
      router.tsx
      store.ts
      providers/
    shared/
      api/
      components/
      hooks/
      i18n/
      lib/
      styles/
      types/
    features/
      auth/
      registration/
      requests/
      states/
      stats/
      layout/
    pages/
      public/
      admin/
    test/
```

Keep framework concerns in `app/`, reusable primitives in `shared/`, and business flows in `features/`. This follows the backend's separation of routes, controllers, services, and repositories by keeping UI, API access, domain state, and presentation components independently testable.

## Routing Plan

Public routes:

| Route | Screen |
| --- | --- |
| `/` | Event overview and registration form. |
| `/register` | Registration form, if separated from landing content. |
| `/register/success` | Submission success with request number. |

Admin routes:

| Route | Screen |
| --- | --- |
| `/admin/login` | Admin login. |
| `/admin` | Dashboard overview. |
| `/admin/requests` | Request list. |
| `/admin/requests/:id` | Request detail. |
| `/admin/states` | Request state management. |
| `/admin/settings` | Frontend-only placeholder or omit until backend settings endpoints exist. |

Use protected route guards for all admin routes except `/admin/login`. On app boot, hydrate the stored token and call `/api/auth/me`; if it fails, clear auth state and redirect to login.

## State Management Plan

Use Redux Toolkit with these slices and APIs:

```text
app/store.ts
shared/api/baseApi.ts
features/auth/authSlice.ts
features/auth/authApi.ts
features/registration/registrationApi.ts
features/requests/requestsApi.ts
features/states/statesApi.ts
features/stats/statsApi.ts
features/layout/layoutSlice.ts
```

State ownership:

- `authSlice`: token, admin profile, auth hydration status.
- `layoutSlice`: sidebar state, active language, theme preference if added.
- RTK Query cache: requests, request details, states, stats, registration mutation, login mutation.
- Local component state: form inputs, modal visibility, transient table controls before committing them to URL params.

Prefer URL query params for request list filters:

```text
page
pageSize
search
state
major
city
archived
from
to
sortBy
sortDir
```

This makes admin list views shareable and refresh-safe.

## API Client Design

Create one `baseApi` using `fetchBaseQuery`:

- `baseUrl`: `import.meta.env.VITE_API_BASE_URL ?? "/api"`
- Add bearer token from `authSlice`.
- Normalize backend errors into a UI-friendly shape.
- On `401`, dispatch logout and redirect to `/admin/login`.

Recommended RTK Query tag types:

```ts
["Auth", "Requests", "RequestDetail", "States", "Stats"]
```

Invalidation rules:

- Registration submit: no admin cache invalidation needed unless admin app is mounted.
- Change request state: invalidate `Requests`, specific `RequestDetail`, and `Stats`.
- Add note: invalidate specific `RequestDetail`.
- Archive/unarchive: invalidate `Requests`, specific `RequestDetail`, and `Stats`.
- Create/update/delete state: invalidate `States`, `Requests`, and `Stats`.

## Data Types

Create frontend API types that match the backend first, then map to UI view models only where it improves clarity.

Core API types:

```ts
type RequestState = {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

type RegistrationRequest = {
  id: string;
  request_number: string;
  full_name: string;
  age: number;
  major: string;
  phone: string;
  email: string;
  city: string;
  state_id: string;
  state_name: string;
  state_slug: string;
  state_color: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};
```

Avoid changing backend field names at the API boundary. If camelCase is preferred in components, perform mapping in a dedicated selector or adapter, not inside random components.

## Public Registration UX

The public screen should be direct and trustworthy:

- Event identity and concise description.
- Registration form fields:
  - Full name.
  - Age.
  - Major.
  - Phone.
  - Email.
  - City.
- Client-side validation matching backend rules.
- Submit button with loading, disabled, and retry states.
- Success panel showing `requestNumber` and state label.
- Field-level backend errors rendered under matching inputs.
- Duplicate conflict message that states whether phone, email, or both already exist.

Do not rely only on frontend validation. The backend remains the source of truth.

## Admin Login UX

Login fields:

- Email.
- Password.

Behavior:

- Submit to `/api/auth/login`.
- Persist token after successful login.
- Redirect to `/admin`.
- Show generic invalid credential message for `UNAUTHORIZED`.
- Rate-limit errors should be displayed as a temporary blocked state if returned by the backend.

Security notes:

- Store token in memory plus `localStorage` for first version, because the backend currently returns bearer tokens and does not set HttpOnly cookies.
- Centralize token read/write in `authSlice` helpers.
- Clear token on logout and on `401`.
- Never log tokens or render them in debug UI.

## Admin Layout

Use a quiet operational layout:

- Left sidebar on desktop.
- Collapsible drawer on mobile.
- Top bar with current admin email, language switch, logout, and compact breadcrumbs.
- Main content constrained for readability but not card-heavy.

Navigation items with Lucide icons:

- Dashboard: `LayoutDashboard`.
- Requests: `ClipboardList`.
- States: `Workflow` or `Tags`.
- Export action: `Download`.
- Archive: `Archive`.
- Logout: `LogOut`.
- Language: `Languages`.

## Dashboard Screen

Use `/api/admin/stats`.

Cards:

- Total active requests.
- Approved.
- Under review.
- No reply.

Charts:

- By state.
- By major.
- By city.

Implementation options:

- First version can use accessible Tailwind bar charts without adding a chart library.
- Use state colors from backend for state distribution.
- Use GSAP only for number count-up and initial chart entrance.

## Requests List Screen

Use `/api/admin/requests`.

Table columns:

- Request number.
- Full name.
- Age.
- Major.
- City.
- Phone.
- Email.
- State badge.
- Created date.
- Archived indicator when `archived=all`.
- Row actions.

Controls:

- Search by name, phone, email, or request number.
- State filter from `/api/admin/states`.
- Major and city text filters.
- Date range filters using ISO datetime values for `from` and `to`.
- Archived segmented control: active, archived, all.
- Sort by backend-supported values: `createdAt`, `fullName`, `age`, `major`, `city`, `state`, `requestNumber`.
- Page size: 10, 20, 50, 100.
- CSV export using the current filters.

UX details:

- Debounce search before writing to URL.
- Keep selected filters visible as removable chips.
- Show empty state that distinguishes no data from no matching filters.
- Maintain keyboard-accessible row actions.

## Request Detail Screen

Use `/api/admin/requests/:id`.

Sections:

- Applicant summary.
- Contact information.
- Current state with color badge.
- State change control.
- Archive or unarchive action.
- Internal notes.
- Add note form.
- Audit log timeline.

State update:

- Load states from `/api/admin/states`.
- Submit `{ stateId }` to `/api/admin/requests/:id/state`.
- Optimistically disable the control during the mutation.
- After success, invalidate list, detail, and stats.

Notes:

- Submit `{ body }` to `/api/admin/requests/:id/notes`.
- Max length: `4000`.
- Clear textarea only after success.

Archive:

- Submit `{ archived: true }` or `{ archived: false }`.
- Confirm archive actions because the item disappears from the default active list.

Audit log:

- Render `actor_type`, admin email when available, action, timestamp, and relevant metadata.
- Use translated action labels in the UI instead of raw action strings where practical.

## State Management Screen

Use `/api/admin/states`.

Features:

- List states ordered by `sort_order`.
- Create state with name, slug, color, and sort order.
- Edit name, color, and sort order.
- Delete non-system states.
- If a state has linked records, allow selecting `transferToStateId` before delete.

Constraints:

- Slug is required on create and must be lowercase snake_case.
- Backend does not allow slug updates, so the edit form should not show slug as editable.
- System states should be visually locked and protected from delete UI.
- Color input must produce hex colors.

## i18next Plan

Locales:

```text
src/shared/i18n/locales/en/common.json
src/shared/i18n/locales/ar/common.json
```

Namespaces can start as `common` and split later if files become large.

Required language behavior:

- English uses `dir="ltr"`.
- Arabic uses `dir="rtl"`.
- Set `document.documentElement.lang`.
- Set `document.documentElement.dir`.
- Persist language choice in `localStorage`.
- Use logical Tailwind utilities where possible, such as `ms-*`, `me-*`, `text-start`, and `text-end`.
- Avoid hardcoded left/right labels in components.

Translation key groups:

```text
app
navigation
auth
registration
requests
requestDetail
states
stats
validation
errors
actions
status
dates
```

Arabic copy should be reviewed by a native speaker before production release.

## Tailwind Design System

Use Tailwind config tokens for:

- Brand colors.
- Semantic colors for success, warning, danger, info, and neutral.
- State badge fallback colors.
- Font family for Latin and Arabic text.
- Border radius with cards at `rounded-lg` or smaller.
- Consistent spacing scale.

Design direction:

- Operational admin UI should be dense, calm, and scannable.
- Public registration page can be more polished, but it should still prioritize form completion.
- Avoid decorative gradients and oversized marketing sections in the admin app.
- Use state colors from the backend only for badges and chart accents, not full-page themes.

## GSAP Usage

Use GSAP through small hooks or utility functions:

```text
shared/hooks/useGsapFadeIn.ts
shared/hooks/useGsapListStagger.ts
```

Allowed uses:

- Route content fade/slide on mount.
- Dashboard metric count-up.
- Success confirmation animation after registration.
- Drawer and modal enter/exit transitions.
- Table row subtle stagger after data loads.

Avoid:

- Animating layout-critical table widths.
- Animating form values controlled by React.
- Hiding content in ways that break accessibility.
- Replacing standard CSS hover/focus states with JavaScript animation.

Respect reduced motion:

- Check `prefers-reduced-motion`.
- Disable non-essential GSAP animations when reduced motion is enabled.

## Accessibility Requirements

- All form inputs must have labels.
- Field errors must be associated using `aria-describedby`.
- Loading buttons must communicate busy state.
- Modals and drawers must trap focus and restore focus after close.
- Icon-only buttons need accessible labels and tooltips.
- State badges cannot rely on color alone.
- Tables need sortable column button labels.
- Arabic RTL mode must preserve logical tab order and readable alignment.

## Error Handling

Implement a central error helper that handles:

- `VALIDATION_ERROR`: map `fields` to form controls.
- `DUPLICATE_REGISTRATION`: show duplicate phone/email conflict message.
- `UNAUTHORIZED`: clear auth and redirect.
- `NOT_FOUND`: show not-found screen or inline not-found message.
- `INTERNAL_SERVER_ERROR`: show generic retry message.
- Network failure: show API unavailable message.

Do not display raw backend stack traces or unknown JSON payloads.

## Testing Plan

Unit and component tests:

- Registration form validation and backend field-error rendering.
- Login success and failure.
- Auth guard redirects.
- Request filter URL serialization.
- State create/edit/delete forms.
- i18n direction switching.

RTK Query tests:

- Auth header injection.
- Cache invalidation after state changes, notes, archive, and state management mutations.
- `401` logout behavior.

End-to-end tests:

- Visitor submits valid registration and sees request number.
- Visitor submits invalid fields and sees errors.
- Admin logs in and lands on dashboard.
- Admin filters requests and opens detail.
- Admin changes request state.
- Admin adds a note.
- Admin archives and unarchives a request.
- Admin exports CSV.
- Admin switches English and Arabic and layout direction changes.

## Implementation Phases

1. Scaffold frontend with Vite, React, TypeScript, React Compiler, Tailwind, Redux Toolkit, RTK Query, React Router, i18next, GSAP, Lucide React, Vitest, and Testing Library.
2. Add app shell, routing, store, `baseApi`, i18n initialization, Tailwind tokens, and shared UI primitives.
3. Implement auth flow, token persistence, protected routes, logout, and `/api/auth/me` hydration.
4. Implement public registration form with full validation, backend error mapping, and success screen.
5. Implement admin layout and dashboard statistics.
6. Implement request list with filters, sorting, pagination, and CSV export.
7. Implement request detail with state transition, notes, archive/unarchive, and audit log.
8. Implement request states management.
9. Add Arabic translations, RTL QA, reduced motion behavior, and accessibility pass.
10. Add unit, component, and end-to-end tests.
11. Run production build, lint, tests, and browser QA against the backend.

## Risks And Backend Gaps

- There is no backend endpoint for updating registration applicant fields.
- There is no backend endpoint for reading or editing `app_settings`.
- There is no endpoint returning distinct majors and cities, so filters must either be free text or derived from current list data. Free text is safer for the first version.
- CSV export is capped through controller logic by forcing `pageSize: 100`; if admins need full exports, backend behavior should be reviewed.
- Bearer token storage in `localStorage` is acceptable for this backend contract but less secure than HttpOnly cookies. If security requirements increase, add cookie-based auth support to the backend.
- PDF text extraction could not be performed with installed tools, so the readable companion Markdown spec was used as the canonical text source.

## Definition Of Done

- All listed public and admin screens are implemented.
- Frontend uses React with TypeScript, React Compiler, Redux Toolkit, GSAP, Lucide React, i18next with English and Arabic, and Tailwind CSS.
- API requests use RTK Query and match backend contracts.
- Admin auth works across reloads and expires cleanly.
- All forms render backend validation errors correctly.
- Arabic mode sets `lang="ar"` and `dir="rtl"` and passes layout QA.
- Critical workflows have automated tests.
- Production build passes.
- No frontend code contains hardcoded secrets, raw tokens in logs, or duplicated API request logic.
