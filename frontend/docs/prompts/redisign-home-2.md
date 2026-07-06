# Task: Create a premium Flight Animation system for my React SVG World Map

You are a Senior Frontend Engineer specialized in React, TypeScript, SVG animations and Framer Motion.

I already have a React component called `HeroMap` that renders a complete world map as SVG paths.

Each country is rendered from an array called `mapRegions` with this structure:

```ts
type Region = {
    id: string;
    label: string;
    d: string; // SVG path
}
```

The map already exists.

Do NOT recreate the map.

Do NOT replace my SVG.

Your job is only to build the flight animation system that renders ABOVE the existing SVG.

---

# Visual Goal

The animation should feel like:

* FlightRadar24
* Google Flights
* Arc browser network animations
* Apple's subtle UI animations

The objective is to communicate:

* global connectivity
* technology
* movement
* intelligence
* worldwide activity

It should feel premium, elegant and minimal.

NOT cartoonish.

NOT playful.

NOT flashy.

Everything should move slowly.

The animation should be beautiful even when someone stares at it for several minutes.

---

# Architecture

Create a reusable component:

```tsx
<FlightAnimation />
```

that is rendered inside HeroMap.

The component must be completely independent.

It should only receive routes.

Example:

```ts
type FlightRoute = {
    id: string;

    from: {
        x: number;
        y: number;
        label: string;
    };

    to: {
        x: number;
        y: number;
        label: string;
    };
}
```

---

# Flight System

Render exactly **4 active airplanes**.

Each airplane must:

* choose one route
* fly to destination
* when arriving
* wait between 300–1200ms
* randomly choose another destination
* continue forever

No airplane should ever stop permanently.

The movement should never synchronize with the others.

Every airplane must have its own timing.

---

# Flight Paths

Flights MUST NOT move in straight lines.

Generate smooth cubic Bézier curves.

Every route should have a natural arc similar to long-haul commercial flights.

The curvature should vary slightly depending on distance.

Long flights:

higher arc.

Short flights:

smaller arc.

No identical curves.

---

# Airplane

Use a minimalist SVG airplane.

Very small.

Around 12–16px.

The airplane should:

* rotate automatically following the tangent of the path
* slightly ease into turns
* have smooth movement
* never snap its rotation

The airplane color:

```
var(--primary-accent)
```

Opacity:

90%

---

# Flight Trail

Every airplane should leave behind an animated trail.

The trail should:

* be dashed
* animate progressively
* fade with opacity
* disappear gradually after the airplane passes

Think of it as if the airplane is drawing the route in real time.

The trail must never remain permanently visible.

---

# Glow

The airplane should have:

* subtle glow
* soft blur
* low opacity

No excessive neon.

The glow should simply make it feel alive.

---

# Idle Motion

Even while flying, each airplane should have tiny micro movements.

Examples:

* ±0.5° rotation variation
* 1px floating effect
* slight opacity breathing

Very subtle.

---

# Randomness

The animation should never look repetitive.

Randomize:

* destination
* duration
* curve height
* wait time
* starting progress
* speed

The result should feel organic.

---

# Performance

The component must maintain 60 FPS.

Avoid unnecessary re-renders.

Use:

* useMemo
* useRef
* requestAnimationFrame when appropriate
* Framer Motion motion values
* SVG paths

Do NOT recalculate paths every frame.

Generate them once.

---

# Responsiveness

Desktop:

4 airplanes

Tablet:

4 airplanes

Mobile:

still 4 airplanes

Reduce speed slightly on mobile.

Never remove airplanes.

---

# Layering

The animation must sit ABOVE the world map.

The airplanes must never cover the Hero text.

The animation should stay inside the SVG boundaries.

---

# Visual Details

Routes should cross oceans.

Avoid tiny local flights.

Prefer intercontinental routes like:

Tokyo → Paris

London → Singapore

São Paulo → Madrid

Los Angeles → Sydney

Dubai → Johannesburg

Toronto → Frankfurt

Singapore → San Francisco

Delhi → Tokyo

Randomize among dozens of predefined destinations.

---

# Code Quality

Produce production-ready code.

Use:

* React
* TypeScript
* Framer Motion

No external animation libraries besides Framer Motion.

No magic numbers without explanation.

Split logic into reusable hooks if necessary.

Use descriptive variable names.

Comment only complex math.

Avoid unnecessary abstractions.

---

# Expected Result

The final effect should look like an expensive SaaS landing page.

When someone opens the website, the world map should already have airplanes slowly crossing continents, drawing elegant arcs with animated dashed trails.

The movement should immediately communicate:

* global scale
* logistics
* artificial intelligence
* worldwide infrastructure
* premium engineering

The animation should be subtle enough that users discover it after a few seconds instead of immediately noticing it.

Prioritize elegance over spectacle.
