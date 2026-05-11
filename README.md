# Able Hands Contracting Website

React/Vite website for Able Hands Contracting.

## Local development

```sh
pnpm install
BASE_PATH=/ PORT=5173 pnpm --filter @workspace/handyman-site dev
```

## Production build

```sh
BASE_PATH=/ PORT=5173 pnpm --filter @workspace/handyman-site build
```

The production output is:

```text
artifacts/handyman-site/dist/public
```

## Netlify deployment

This repository includes `netlify.toml`, so Netlify should use these settings automatically:

- Build command: `pnpm --filter @workspace/handyman-site build`
- Publish directory: `artifacts/handyman-site/dist/public`

The estimate form is configured for Netlify Forms, including photo uploads.
