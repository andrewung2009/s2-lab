# S2 // LAB — LS2 Chapter 1, in motion

Animated notes and worked question-solving labs for **Edexcel International A Level Statistics 2
(WST02)**, built only from the **LS2 Chapter 1 notes**.

The site covers exactly the notes:

- the Binomial distribution `Bin(n, p)` and its four conditions
- the Poisson distribution `Po(λ)` and its three conditions
- mean and variance, including `Var(X) = npq` with `q = 1 − p`
- the Poisson approximation to the binomial (`λ = np`, no continuity correction)
- the Normal approximations to the Binomial and Poisson, with continuity correction

It is an independent study resource. It is not endorsed by Pearson. It does not reproduce
past-paper content or the question examples from the notes.

## What is inside

- **Binomial Lab** — animated PMF build, cumulative shading, live probability readout, and an
  animated worked solution that updates with n, p, x and the probability phrase.
- **Poisson Lab** — λ = μt interval scaling, an auto-playing Poisson arrival timeline, interval
  convergence histogram, and an animated worked solution.
- **Approximation Labs** — three routes from the notes: `Bin → Po`, `Bin → Normal` and
  `Po → Normal`, each with condition checks, continuity-correction controls, a live curve, and a
  worked exact-vs-approximate solution.

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
- Animated Poisson timeline and interval histogram in SVG
- Numerically stable log-space distribution functions in `src/lib/distributions.ts`
- Normal PDF/CDF and continuity-correction helpers in `src/lib/normal.ts`
- Animated worked-solution steps in `src/components/SolutionSteps.tsx`
- Vitest coverage for the probability maths
- KaTeX for live formulas
- Custom CSS design system in `src/styles/global.css`

## Accuracy notes

- Probabilities are evaluated in log space using a Lanczos log-gamma implementation, so large
  `n` values remain stable.
- The Poisson approximation follows the notes: `n` large and `p` small, with calculation
  conditions `np ≤ 10` and `p ≤ 0.1`, then `λ = np`. No continuity correction is used.
- The Normal approximation labs follow the notes: `np > 5` and `nq > 5` (calculation
  `np > 10`) for the Binomial, and `λ > 10` for the Poisson. Both require a continuity
  correction.
- The question-solving readouts use `F(x) = P(X ≤ x)`, including the off-by-one cases for
  “at least” and “more than”. This is a solver tool, not extra notes content.
