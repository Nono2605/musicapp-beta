Deploying this project to Vercel

This repository is a static site (HTML/CSS/JS). The included vercel.json marks the project as a static deployment so Vercel will serve files from the repo root.

Quick deploy (recommended)
1. Go to https://vercel.com and sign in with GitHub.
2. Click "New Project" → "Import Git Repository" and choose: https://github.com/Nono2605/musicapp-beta
3. Vercel should detect a static project. Confirm settings and click "Deploy".

CLI deploy
1. Install the Vercel CLI: npm i -g vercel
2. From the repo root run: vercel
3. Follow the prompts to link the project and run: vercel --prod to publish production.

Notes and tweaks
- The vercel.json uses @vercel/static to serve index.html and static assets. No build step required.
- If you later add a framework (Next.js, Svelte, etc.), remove or adjust vercel.json and add the appropriate build command.
- If you want the project to live at a custom domain, add it in the Vercel dashboard and follow DNS instructions.

If you want, I can:
- add a package.json with scripts for local preview (serve)
- create a GitHub Action that calls vercel CLI for CI deploys
- prepare env var handling for secrets

