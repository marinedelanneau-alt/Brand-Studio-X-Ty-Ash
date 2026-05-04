This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Keep the app running after closing VS Code

`npm run dev` is tied to the terminal session, so the app stops when VS Code closes.

To keep the app available on `http://localhost:3000` after closing VS Code, use the background production server instead:

```bash
npm run app:start
```

Useful commands:

```bash
npm run app:status
npm run app:stop
```

The first start will build the app automatically if needed, then launch `next start` in the background and write logs to `.runtime/`.

## Auto-sync local production with code changes

If you want your local production server to update automatically every time you edit code, start the sync watcher:

```bash
npm run app:sync:start
```

Useful commands:

```bash
npm run app:sync:status
npm run app:stop
```

This mode watches the project files, runs a fresh production build, and restarts `next start` after each change.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
