# MacroFit

A mobile-first, installable PWA for macro tracking, food-photo logging, workout
programming and progress tracking. Local-first: all your data lives in
IndexedDB on your device — no backend is required to use the app.

> **Note on this build.** This project was generated in one pass and has not
> been run through `npm install` / a browser yet (the environment that built
> it has no network access). Read [Testing checklist](#9-testing-checklist)
> before you trust it — run through those steps as your first task after
> `npm install`. The architecture and logic are complete and consistent, but
> treat it as a strong first draft, not a QA'd release.

---

## 1. Project structure

```
macrofit/
├── public/
│   ├── manifest.webmanifest      # PWA manifest
│   ├── sw.js                     # service worker (cache-first shell, offline fallback)
│   ├── offline.html              # shown when offline with nothing cached
│   └── icons/                    # app icons (192, 512, maskable)
├── server/                       # example serverless functions for real AI (not required to run the app)
│   ├── analyze-food.js
│   └── estimate-body-fat.js
├── src/
│   ├── main.jsx                  # entry point
│   ├── App.jsx                   # routing + onboarding gate
│   ├── index.css                 # Tailwind + base styles
│   ├── context/
│   │   ├── AppContext.jsx        # profile, settings, theme
│   │   └── TimerContext.jsx      # rest timer (persists across screens)
│   ├── layouts/
│   │   └── AppLayout.jsx         # bottom nav (mobile) / sidebar (desktop)
│   ├── pages/
│   │   ├── Onboarding.jsx
│   │   ├── Home.jsx
│   │   ├── Food.jsx
│   │   ├── Workout.jsx
│   │   ├── Progress.jsx
│   │   └── Profile.jsx
│   ├── components/
│   │   ├── MacroCard.jsx          # calorie ring + macro bars
│   │   ├── FoodComponents.jsx     # camera capture, AI result review, meal log, add-food modal
│   │   ├── WorkoutComponents.jsx  # program drafter/editor, session runner, rest timer, history, PRs
│   │   └── ProgressComponents.jsx # weight/measurement charts, photos, body-fat estimator, water/habits/sleep
│   ├── services/
│   │   ├── nutritionCalc.js       # BMR/TDEE/macro targets, Navy body-fat formula
│   │   ├── workoutGenerator.js    # rule-based program drafting + progression suggestions
│   │   ├── foodAnalysisService.js       # swap this for a real vision API (see §6)
│   │   └── bodyCompositionService.js    # swap this for a real vision API (see §6)
│   ├── data/
│   │   ├── foodDatabase.js       # common + Filipino foods seed data
│   │   └── exerciseDatabase.js   # exercise library
│   ├── db/
│   │   ├── database.js           # IndexedDB wrapper (schema, get/put/export/import)
│   │   └── seedData.js           # demo data for first launch
│   └── utils/
│       ├── date.js
│       └── macros.js
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── .env.example
```

## 2. Installation

Requires Node.js 18+.

```bash
npm install
```

## 3. Development

```bash
npm run dev
```

Opens on `http://localhost:5173`. The service worker only activates on a
production build/preview (see below) — during `npm run dev` the app still
works, just without offline caching.

## 4. Production build

```bash
npm run build
npm run preview   # serve the build locally at http://localhost:4173 to test PWA install + offline
```

`npm run preview` (or any static host) is the right way to test installability
— `npm run dev` doesn't serve a build the way a real deployment would.

## 5. Installing as a PWA

Once deployed on HTTPS (required for service workers, except `localhost`):

- **Android (Chrome):** an "Install app" prompt appears automatically, or use
  the browser menu → *Install app*.
- **iOS (Safari):** Share button → *Add to Home Screen*. iOS doesn't support
  the automatic install prompt or all manifest features, but the icon,
  standalone display, and offline shell all work.
- **Desktop (Chrome/Edge):** an install icon appears in the address bar, or
  browser menu → *Install MacroFit*.
- **Windows/macOS/Linux browsers generally:** same as desktop above.

## 6. Connecting a real AI backend

Two integration points, both currently mocked so the app works fully offline
out of the box:

- `src/services/foodAnalysisService.js` → `analyzeFoodPhoto(photo)`
- `src/services/bodyCompositionService.js` → `estimateBodyComposition({photos, navyEstimate})`

To go live:

1. Deploy `server/analyze-food.js` and `server/estimate-body-fat.js` (or your
   own equivalents) as serverless functions — they're written in a
   Vercel/Netlify-handler style; adapt to your host if needed. They call the
   Anthropic API server-side using an example vision prompt.
2. Set `ANTHROPIC_API_KEY` as a **server-side** environment variable on your
   host (see `.env.example`). Never expose it to the client — don't prefix it
   with `VITE_`, don't put it in `src/`.
3. Replace the body of `analyzeFoodPhoto()` / `estimateBodyComposition()` with
   a `fetch()` to your deployed endpoint, keeping the same return shape
   (`{ foods: [...] }` / `{ estimatedRange, confidence, limitations }`) so no
   other file needs to change.
4. The photo-confirmation UI (`BodyFatEstimator` in `ProgressComponents.jsx`,
   the capture flow in `FoodComponents.jsx`) already asks the user before any
   photo would leave the device — leave that step in place.

You can swap in OpenAI, Gemini, or a self-hosted model instead — just keep the
response shapes the same.

## 7. Deployment

Any static host works for the frontend (Vercel, Netlify, Cloudflare Pages,
GitHub Pages, your own nginx box). Steps are generic:

```bash
npm run build        # outputs to dist/
# upload/deploy dist/ to your static host
```

If you connect real AI analysis, also deploy `server/*.js` as serverless
functions on the same platform (Vercel/Netlify both support this directly)
and set `ANTHROPIC_API_KEY` in that platform's environment variable settings.

## 8. Environment variables

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | server only | only if using real AI analysis | Powers `server/analyze-food.js` and `server/estimate-body-fat.js` |

The frontend itself needs **no** environment variables to run — it's fully
local-first by default.

## 9. Testing checklist

Run through this after `npm install`, before trusting the build:

- [ ] `npm run dev` starts without errors; onboarding flow completes and saves a profile
- [ ] "Load demo data" on onboarding populates Home/Food/Workout/Progress with sample data
- [ ] Macro calculator numbers look sane for a test profile (compare BMR/TDEE by hand once)
- [ ] Add a manual food entry; totals on Home and Food update
- [ ] Camera scan: allow permission → capture → mock "Analyzing" → review screen → edit a value → confirm → appears in log. Also test denying camera permission (should offer "Upload Photo Instead")
- [ ] Generate a workout program, edit an exercise (replace/add/remove/sets/reps), save it
- [ ] Start a workout session, log sets, confirm rest timer starts and **keeps running while you navigate to another tab**, complete all exercises, confirm it's saved to History and updates Personal Records
- [ ] Log a weigh-in, confirm the chart renders
- [ ] Log body measurements
- [ ] Add two progress photos of the same angle on different (simulated) dates, confirm the compare slider works
- [ ] Body-fat estimator: measurement-based number appears if waist/neck are set; photo-based flow shows the consent prompt before "running"
- [ ] Export JSON and CSV from Profile, confirm files download and open correctly
- [ ] Import a previously exported JSON backup
- [ ] Toggle dark/light theme and metric/imperial units
- [ ] `npm run build && npm run preview`, then: install as PWA on at least one real device, reload with network disabled to confirm the offline shell/offline banner appears, confirm manual logging/history/weight/workouts still work offline
- [ ] Delete All Data flow requires confirmation and actually clears IndexedDB

## 10. Security & privacy considerations

- All fitness data (food logs, workouts, weight, measurements, photos) is
  stored **only** in this browser's IndexedDB unless you explicitly export it.
  There is no backend database in the default setup.
- Progress photos and food photos are **never uploaded anywhere** in the
  default mock configuration. If you connect a real AI backend, the app shows
  an explicit confirmation before any photo would be sent externally (see
  `BodyFatEstimator` and the scan flow) — keep that prompt in place if you
  extend the app.
- API keys must live **server-side only** (`server/*.js` + host environment
  variables). Never embed a key in `src/` or a client-exposed `VITE_*` env var.
- AI-generated nutrition and body-composition numbers are always presented as
  editable estimates (food) or ranges with a confidence + limitations list
  (body fat) — never as exact, medical-grade measurements. Keep that framing
  if you customize the prompts in `server/*.js`.
- "Delete All Data" in Profile clears every IndexedDB store on this device.
  It cannot reach data the user separately exported.
