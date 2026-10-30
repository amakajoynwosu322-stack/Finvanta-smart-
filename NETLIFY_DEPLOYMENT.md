# Netlify Deployment Guide — FINVANTA

This guide provides step-by-step instructions for deploying the **FINVANTA** Vite + React + TypeScript web application to Netlify.

---

## 1. Quick Deploy via Netlify Dashboard (Recommended)

1. **Push your code to GitHub / GitLab / Bitbucket**:
   ```bash
   git add .
   git commit -m "feat: prepare FINVANTA for Netlify deployment"
   git push origin main
   ```

2. **Log in to Netlify**:
   - Go to [https://app.netlify.com](https://app.netlify.com).
   - Click **"Add new site"** > **"Import an existing project"**.
   - Connect your Git provider and select the `FINVANTA` repository.

3. **Verify Build Configuration**:
   - **Base directory**: Leave blank (root).
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   *(Netlify will automatically detect these from the included `netlify.toml` file).*

4. **Configure Environment Variables**:
   In the Netlify dashboard under **Site configuration > Environment variables**, add:
   - `VITE_SUPABASE_URL`: *(Your Supabase project URL, e.g. `https://xyzcompany.supabase.co`)*
   - `VITE_SUPABASE_ANON_KEY`: *(Your Supabase public anon key)*
   - `VITE_FIREBASE_API_KEY`: *(Optional if using custom Firebase environment variables)*
   - `VITE_FIREBASE_PROJECT_ID`: *(Optional)*

5. **Deploy Site**:
   - Click **"Deploy FINVANTA"**.
   - Deployment typically completes in under 60 seconds.

---

## 2. Deploy via Netlify CLI

If you prefer deploying from your terminal:

1. **Install Netlify CLI globally**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Authenticate with Netlify**:
   ```bash
   netlify login
   ```

3. **Build the production bundle**:
   ```bash
   npm run build
   ```

4. **Deploy preview or production**:
   - For a draft preview:
     ```bash
     netlify deploy
     ```
   - For immediate live production:
     ```bash
     netlify deploy --prod --dir=dist
     ```

---

## 3. Included Architecture & Routing Configurations

- **SPA Routing (`_redirects` & `netlify.toml`)**:
  All client-side routes fallback to `/index.html` with status `200` to prevent `404 Not Found` errors when refreshing deep links.
- **Security Headers**:
  - `X-Frame-Options: SAMEORIGIN` prevents clickjacking.
  - `X-Content-Type-Options: nosniff` enforces MIME types.
  - `Referrer-Policy: strict-origin-when-cross-origin` preserves privacy.
- **Static Asset Caching**:
  Assets in `/assets/` are served with immutable long-term cache headers.

---

## 4. Custom Domain and HTTPS Setup

1. Under **Site configuration > Domain management**, click **"Add custom domain"**.
2. Enter your custom domain (e.g., `invest.finvanta.com` or `finvanta.com`).
3. Point your DNS records:
   - For subdomains: `CNAME` pointing to your Netlify site URL (e.g., `your-site.netlify.app`).
   - For apex domains: `A` record pointing to `75.2.60.5`.
4. Netlify will automatically provision a free Let's Encrypt SSL certificate within a few minutes.

---

## 5. Troubleshooting Checklist

| Issue | Resolution |
|-------|------------|
| 404 on page refresh | Check that `public/_redirects` or `netlify.toml` `[[redirects]]` is present. |
| Build fails on missing dependencies | Run `npm install` and verify `package.json` contains all dependencies. |
| Supabase shows unconfigured | Enter your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Netlify site settings. |
