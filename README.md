# fee-remit-docs

This is a Next.js + Fumadocs documentation app.

## App Environment

Set these variables for the web app:

```bash
NEXT_PUBLIC_DOCS_TREE_API_URL=
NEXT_PUBLIC_DOCS_PAGE_API_URL=
NEXT_PUBLIC_DOCS_SEARCH_API_URL=
NEXT_PUBLIC_DOCS_CHAT_API_URL=
```

The web app now reaches backend data only through API Gateway. Docs tree, docs
page content, search, and AI chat are all backed by Lambda endpoints.

Run development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```
