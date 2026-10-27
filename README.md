# S2 // LAB — Binomial & Poisson, made visible

An interactive distribution lab for **Edexcel International A Level Statistics 2 (WST02)**.

The site focuses on the S2.1 content:

- the Binomial distribution `B(n, p)`
- the Poisson distribution `Po(λ)`
- mean and variance
- cumulative probability phrasing
- the Poisson additive property
- the Poisson approximation to the binomial (`λ = np`)

It is an independent study resource. It is not endorsed by Pearson and does not reproduce
past-paper content.

## What is inside

- **Binomial Lab** — live PMF, cumulative shading, probability phrase translator, parameter
  presets, and a Galton board simulation.
- **Poisson Lab** — rate × interval rescaling, live PMF, a Poisson arrival timeline, interval
  histogram convergence, and an additive-property lab.
- **Approximation Lab** — overlaid `B(n, p)` and `Po(np)` distributions, a residual chart,
  error metrics, a conditions check, and a morph animation.

Everything is client-side, static, and designed for GitHub Pages.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deploy to GitHub Pages

1. Push the project to a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`, or run the **Deploy to GitHub Pages** workflow manually.

The Vite config uses `base: './'`, so the build works from a project page such as
`https://username.github.io/repository-name/` without extra configuration.

The workflow builds the site, runs lint and the maths tests, uploads `dist`, and deploys it to
Pages.

## Architecture

- React 19 + Vite + TypeScript
- Custom SVG charts with keyboard/touch interaction
- Canvas 2D for the Galton board
- Canvas-free Poisson timeline rendered in SVG
- Numerically stable log-space distribution functions in `src/lib/distributions.ts`
- Vitest coverage for the probability maths
- KaTeX for live formulas
- Custom CSS design system in `src/styles/global.css`

## Accuracy notes

- Probabilities are evaluated in log space using a Lanczos log-gamma implementation, so large
  `n` values remain stable.
- The Poisson approximation conditions are presented as the usual rule of thumb
  (`n ≥ 50`, `p ≤ 0.1`), not as a strict theorem. The exam point is to comment that `n` is large
  and `p` is small, then use `λ = np`.
- Cumulative probability phrases follow the S2 convention `F(x) = P(X ≤ x)`, including the
  off-by-one cases for “at least” and “more than”.
