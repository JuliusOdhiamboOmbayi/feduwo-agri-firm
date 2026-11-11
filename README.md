# FEDUWO AGRI CONSULTANT

Responsive agricultural consultancy website and API for client enquiries, consultations, farmer training, recruitment, agricultural insights and administration.

## Technology

- React 18, Vite, React Router, Tailwind CSS, Framer Motion, Lucide React, React Hook Form and Axios
- Node.js, Express, Vercel Functions and Supabase PostgreSQL
- Supabase private Storage for applicant documents
- JWT authentication, bcrypt password hashing, and Nodemailer notifications

## Local setup

1. Install packages:

   ```powershell
   npm install
   ```

2. Create a Supabase project. In its SQL Editor, run the complete [`supabase/schema.sql`](./supabase/schema.sql) script. This creates the tables, private document bucket, and database-backed rate-limit function.
3. Copy `.env.example` to `.env`. Set the Supabase project URL, the server-only service role key, and a random `JWT_SECRET` of at least 32 characters. Never expose the service role key as a `VITE_` variable or commit it.

   ```powershell
   Copy-Item .env.example .env
   ```

4. Create the initial administrator:

   ```powershell
   npm run create-admin
   ```

   Set `ADMIN_NAME`, `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters in `.env`.
5. Optional: set SMTP values to receive new-enquiry, consultation, registration and application email notifications. Without SMTP configuration, submissions are still saved.
6. Start the API and frontend in separate terminals:

   ```powershell
   npm run server
   npm run dev
   ```

   Vite proxies `/api` requests to the local Express server at `http://localhost:5000`.

## Deploy to Vercel + Supabase

The Vercel configuration builds the Vite site as static assets and routes `/api/*` to an Express serverless function. Supabase provides PostgreSQL and a private Storage bucket; no MongoDB or Render service is used.

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor.
2. In Vercel, import `JuliusOdhiamboOmbayi/feduwo-agri-firm` from GitHub. Keep the project root at the repository root and use the checked-in `vercel.json` settings.
3. Add these environment variables in Vercel for Production (and Preview if needed):

   | Variable | Value |
   |---|---|
   | `SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-only service role key; keep secret |
   | `JWT_SECRET` | Random secret of at least 32 characters |
   | `SITE_URL` | The deployed site origin, such as `https://your-project.vercel.app` |
   | `CLIENT_ORIGIN` | Optional allowed origin; Vercel deployment origins are detected automatically |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Optional mail delivery settings |
   | `NOTIFICATION_EMAIL` | Optional recipient for site notifications |

4. Deploy the site.
5. Provision the first administrator from a trusted local machine: put `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_NAME`, `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` in a local, untracked `.env`, then run:

   ```powershell
   npm run create-admin
   ```

   Do not add the service-role key or admin password to source control or expose them to the browser. The provisioning script updates the administrator password if run again.
6. Verify `https://your-project.vercel.app/api/health`, then sign in at `/admin`.

Vercel's serverless request payload limit means applicant documents are limited to **4 MB combined per application**. Documents are stored in the private Supabase bucket and downloaded only through the authenticated admin API. Vercel Free usage and Supabase quotas/retention policies are subject to their current provider limits.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Local Express port (default `5000`) |
| `NODE_ENV` | Runtime environment |
| `CLIENT_ORIGIN` | Optional comma-separated browser origins |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key |
| `JWT_SECRET` | Signing secret, minimum 32 characters |
| `JWT_EXPIRES_IN` | JWT lifetime (default `8h`) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | One-time local administrator provisioning values |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Optional SMTP delivery settings |
| `NOTIFICATION_EMAIL` | Recipient for website notifications |
| `SITE_URL` | Canonical deployment origin |
| `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL` | Set automatically by Vercel; used for origin detection |
| `VITE_API_URL` | Optional API base URL for a separately deployed client |

## API overview

Public endpoints:

- `POST /api/auth/login` — administrator sign-in
- `POST /api/consultations` — consultation request
- `POST /api/enquiries` — contact enquiry
- `GET /api/training` and `POST /api/training/register`
- `GET /api/jobs` and `POST /api/jobs/:id/applications` (PDF/DOC/DOCX; 4 MB combined)
- `GET /api/articles`, `GET /api/articles/:slug`
- `GET /api/projects` — published, verified projects only
- `POST /api/newsletter`
- `GET /api/health`

Protected endpoints require `Authorization: Bearer <token>`:

- `GET /api/admin/dashboard`
- `GET|POST /api/admin/users`, `PATCH /api/admin/users/:id` (admin role)
- `GET|POST /api/admin/:resource`, `PATCH|DELETE /api/admin/:resource/:id`
- `GET /api/admin/applications/:id/documents/:filename` — authorized private document download

Admin resources include consultations, enquiries, training, registrations, jobs, applications, articles, projects, subscribers and activities. Project publishing is limited to administrators; project pages show only verified records. Deletion is limited to administrators.

## Security and privacy

- Staff passwords are bcrypt-hashed; public account creation is disabled.
- JWTs expire and protected APIs re-check that the user is active.
- Supabase Row Level Security is enabled for every application table without public access policies. Only server functions use the service-role key.
- Login and application rate limits are stored in PostgreSQL so they work across serverless invocations.
- Applicant documents are signature-checked, stored in a private bucket, and require an authenticated administrator session to download.
- Do not deploy example values. Use TLS, rotate credentials, back up data securely, and configure an upload-retention/deletion process.
- The site collects personal information for replies, registrations and recruitment. Configure a privacy notice and retention practices for the organization, limit access to authorized staff, and obtain Kenya-specific legal advice for Data Protection Act, 2019 compliance. This starter is not a legal compliance certification.

## Content and launch checklist

- Supplied contact details and logo are included. No office address, testimonials, biographies, qualifications, registrations, projects, results, vacancy or course schedules have been invented.
- Add verified programmes, vacancies, articles and projects through the authenticated admin dashboard. Project results must be verified before publication.
- Configure the actual domain in `SITE_URL`, SMTP credentials, Supabase backups and production environment variables.
- Replace or review the general privacy and terms text with company-approved legal copy.
- Stock photography is remotely loaded from Unsplash; replace with licensed company photography for final brand launch.
