# fee-remit-docs

This is a Next.js + Fumadocs documentation app.

## App Environment

Set these variables for the web app:

```bash
DOCS_API_BASE_URL=
# Optional, when API Gateway requires them:
DOCS_API_KEY=
DOCS_API_AUTHORIZATION=
```

The browser calls only same-origin Next.js routes. The Next.js server proxies
docs tree, page content, search, and AI chat to API Gateway; the upstream URL
and optional credentials are never sent to the browser.

For the EC2 deployment, put the same values in
`/etc/personal-docs-web.env` (owned by `root` with mode `600`). The deploy
script passes that file to the container at runtime; do not supply these values
as Docker build arguments. The deployment waits for the container health check
before reporting success.

Run development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```
