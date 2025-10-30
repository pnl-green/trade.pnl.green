# Intelayer Marketing Site

A dark, crypto-centric marketing experience for Intelayer's multi-venue trading terminal. Built with React, Vite, TypeScript, Tailwind CSS, and MDX documentation.

## Getting Started

```bash
pnpm install
pnpm dev
```

Or using npm:

```bash
npm install
npm run dev
```

The dev server runs on [http://localhost:5173](http://localhost:5173).

## Available Scripts

- `pnpm dev` – start the Vite development server
- `pnpm build` – type-check and create a production build in `dist/`
- `pnpm preview` – locally preview the production build
- `pnpm lint` – run ESLint against TypeScript, TSX, and MDX files
- `pnpm typecheck` – run the TypeScript compiler without emitting files

## Environment Variables

Create a `.env` file at the project root and supply any of the following variables as needed:

```
VITE_TRADE_URL=https://trade.intelayer.com
VITE_DISCORD_URL=
VITE_TWITTER_URL=
VITE_TELEGRAM_URL=
VITE_YOUTUBE_URL=
VITE_GITHUB_URL=
VITE_CONTACT_ENDPOINT=
```

Unset social URLs are automatically hidden from the Socials page. If `VITE_CONTACT_ENDPOINT` is omitted, the Contact page renders a `mailto:` fallback.

## Linting & Formatting

The project ships with ESLint (flat config) and Prettier. Most editors will automatically pick up the configuration; otherwise run `pnpm lint` before committing changes.

## Deployment

1. Run `pnpm build` to generate the optimized SPA in `dist/`.
2. Upload the contents of `dist/` to your preferred static host (AWS Amplify or S3 + CloudFront are recommended).
3. Ensure the SPA fallback rewrites unknown routes to `index.html`.
4. Configure environment variables in your hosting environment for runtime links.

Static assets such as `sitemap.xml` and `robots.txt` are placed in the `public/` directory and copied during build.

## Project Structure

```
intelayer-marketing/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   │   └── docs/
│   ├── pages/
│   ├── routes/
│   ├── styles/
│   └── types/
├── eslint.config.js
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

Each MDX document inside `src/content/docs/` is rendered through the Docs hub with automatic sidebar navigation.

## Security & Privacy Notes

- Content Security Policy defaults to self-hosted assets; analytics must remain opt-in.
- The app avoids storing exchange credentials and only references external venue APIs from documentation copy.

## License

Proprietary – do not distribute without permission.
