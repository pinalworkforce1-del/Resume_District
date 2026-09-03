# Level Up — Resume District

Interactive conversion of **Episode 1: Interview Unlocked**. It uses the shared Level Up Supabase account, writes progress as `resume-district`, and returns learners to the Journey Portal.

## Local test

Copy `.env.example` to `.env`, add the shared Supabase values, then run `npm install` and `npm run dev`.

## GitHub Pages

Add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Select **GitHub Actions** under **Settings → Pages**. The repository name must be `Resume_District` unless `base` in `vite.config.ts` is changed.
