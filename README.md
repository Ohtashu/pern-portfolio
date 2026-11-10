# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Supabase projects

Create a `.env.local` file in the project root and set the Supabase project URL and publishable key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The app reads these values directly from Vite. Use a Supabase publishable key or legacy anon key only; Vite-prefixed values are included in the browser bundle, so never put a secret or service-role key here. `.env.local` is ignored by Git and should not be committed.

Set the same variables in your deployment environment. The app reads records from the `public.projects` table using `id`, `name`, `description`, `language`, `demo_url`, and `repo_url`. A valid HTTP(S) demo URL is shown as the project link, with the repository URL used as a fallback. Configure Supabase Row Level Security to allow the public portfolio to read only the intended project data.

## Admin page

The project manager is available locally at `http://localhost:5173/#/admin` and on GitHub Pages at `https://ohtashutech.github.io/pern-portfolio/#/admin`. It uses Supabase email/password Auth and the same publishable client as the public site; it does not need or accept a service-role key.

1. In Supabase **Authentication → Users**, create your admin account. Confirm the account if email confirmation is enabled. The page has sign-in only; it does not provide public sign-up.
2. Before applying the SQL, review the existing policies on `public.projects`. The script in `supabase/admin.sql` replaces all policies on that table so a leftover permissive write policy cannot grant public edits. Do not run it if another application depends on a different policy set without first reconciling those requirements.
3. Run `supabase/admin.sql` in the Supabase SQL Editor. It enables RLS, grants public reads, and permits project writes only to authenticated users listed in `public.admin_users`.
4. Copy the admin account's UUID from **Authentication → Users** and run the example `INSERT` at the bottom of the SQL script with that UUID. Keep admin allowlist changes restricted to the Supabase dashboard/SQL Editor.
5. Open `/#/admin`, sign in, and create, edit, or delete project records. Deletion asks for confirmation.

6. Your supplied schema does not include `public.portfolio_settings`. Run `supabase/portfolio-settings.sql` in the SQL Editor after `supabase/admin.sql` to create it. The Portfolio tab can then edit profile content, skills, contact information, social links, and the CV URL. The settings are publicly readable and only allowlisted admins can write them; do not put private information in them. Populate the settings in the admin page: absent database content is not replaced with local personal details.

For the CV, upload a PDF through the admin page or enter a public HTTPS link to a hosted file. The link opens the file; whether it downloads immediately depends on the hosting server's `Content-Disposition` headers and the visitor's browser.

RLS is the security boundary; hiding the admin interface is not authorization. Keep the allowlist private, never grant anonymous writes, and verify policies after changes. If a browser request fails, inspect the browser console and Supabase Auth/database logs without sharing credentials.

## Portfolio file storage

After `supabase/admin.sql` and adding an admin, review existing `storage.objects` policies, then run `supabase/portfolio-storage.sql` in the SQL Editor. It creates or updates the public `portfolio-cvs` and `portfolio-project-images` buckets and their policies. Public files are readable by anyone; authenticated allowlisted admins can insert, update, and delete. Restrictive policies prevent existing permissive policies from granting `anon` or non-admin `authenticated` users writes to these buckets, while leaving other buckets alone. Review any custom database roles and policies separately. Re-running the migration updates its own policies and bucket settings.

`uploadCv(supabase, file)` and `uploadProjectImage(supabase, file)` from `utils/portfolio-uploads.js` accept the signed-in Supabase client and a browser `File`, and resolve to its public URL or throw on validation/upload failure. CVs accept `application/pdf` up to 5 MiB; images accept `image/jpeg`, `image/png`, or `image/webp` up to 10 MiB. Empty files are rejected. Paths use random UUIDs rather than user filenames, and uploads never overwrite existing files. The admin page saves the resulting URLs as `cv_url` or `image_url`.

Bucket MIME and size limits apply on the server as well as in the helper, but MIME types are supplied by the uploader and do not verify file contents. Only trusted admins should upload, and public URLs must not contain confidential documents. Replacing a URL does not delete old objects; manage unused files in the Supabase dashboard. Test anonymous, non-admin, and admin access against your own Supabase project after applying the migration.
