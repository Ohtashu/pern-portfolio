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

RLS is the security boundary; hiding the admin interface is not authorization. Keep the allowlist private, never grant anonymous writes, and verify policies after changes. If a browser request fails, inspect the browser console and Supabase Auth/database logs without sharing credentials.
