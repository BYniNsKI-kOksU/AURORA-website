# AURORA — project website

React + Vite project website for AURORA.

The site documents the current five-pipeline architecture:

- 16K, 16-bit Gaia DR3 all-sky mapping;
- Paczyński microlensing animation;
- five-class variable-star animation;
- linearly propagated stellar proper motion;
- static and travelling-observer views from a 3D Galactic catalogue.

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Vite will show the local URL in the terminal. For a production build run `npm run build`.

## Contents

- `src/App.jsx` — page composition, pipeline atlas and current scientific content
- `src/components/` — reusable interactive React components
- `src/styles.css` — responsive visual system
- `src/main.jsx` — React application entry point
- `results/` — lightweight, browser-ready previews derived from AURORA outputs
- `variable/` — reserved location for web-ready variable-star catalogue subsets

The full-resolution image and video masters remain in the repository-level `results/` directory rather than being duplicated into the site.
