# Page transitions

Add a short fade between application pages, including sign-in and registration, without changing navigation or page behavior. Keep it lightweight and respect reduced-motion preferences; security, privacy, and availability remain unchanged.

## Decision

Use the browser's view transitions with SvelteKit navigation. This avoids a dependency and preserves page state. A sliding transition was considered but rejected as more distracting. Browsers without support, users requesting reduced motion, and navigation within the same path continue without animation.

## Risks and verification

View transitions depend on browser support, so unsupported browsers must navigate normally. Check the application build and navigation, including reduced motion and authentication pages.
