# FEDUWO AGRI CONSULTANT

Responsive agricultural consultancy website and API for client enquiries, consultations, farmer training, recruitment, agricultural insights and administration.

## Technology

- React 18, Vite, React Router, Tailwind CSS, Framer Motion, Lucide React, React Hook Form and Axios
- Node.js, Express, MongoDB, Mongoose, JWT and bcrypt
- Multer 2 for private applicant-document uploads
- Nodemailer for optional email notifications

## Requirements

- Node.js 20 or later
- MongoDB 6 or later (local or managed)
- npm

## Local setup

1. Install packages:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` and set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and the initial administrator values. Do not commit `.env`.

   ```powershell
   Copy-Item .env.example .env
   ```

3. Optional: set SMTP values to receive new-enquiry, consultation, registration and application email notifications. Without SMTP configuration, submissions are still saved and the API reports that a notification was not sent.

4. Create or update the initial administrator:

   ```powershell
   npm run create-admin
   ```

5. Start the API and frontend in separate terminals:

   ```powershell
   npm run server
   npm run dev
   ```

6. Open the Vite URL (normally `http://localhost:5173`). The API is available at `http://localhost:5000/api`.

For a production frontend build, run `npm run build`. The Express application serves the generated `dist` directory. Set `NODE_ENV=production`, `CLIENT_ORIGIN`, `SITE_URL`, MongoDB and JWT values for the target deployment. Provision HTTPS at the hosting/reverse-proxy layer. The XML sitemap is available when `SITE_URL` is set; `robots.txt` is served from the frontend public assets.

## Render + MongoDB Atlas deployment

The root `render.yaml` describes a single Render Node web service that builds the Vite client and serves the Express API and frontend on the same origin. This keeps `/api` working without a separate frontend API URL.

1. Push this repository to a GitHub repository you own.
2. Create a MongoDB Atlas cluster and database user. Allow connections from your deployment host (or use Atlas network access configured for your Render service), then copy the database connection string.
3. In Render, choose **New → Blueprint**, connect the GitHub repository, and select `render.yaml`.
4. Enter the requested `MONGODB_URI` in Render's environment setup. Render generates `JWT_SECRET`. Keep both values in Render, never in the repository.
5. After the first successful deploy, set `ADMIN_NAME`, `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (minimum 12 characters) in the Render service environment. Run `npm run create-admin` once from the Render Shell; remove `ADMIN_PASSWORD` from the service environment after setup. Admin setup values are deliberately not committed to the Blueprint.
6. Configure optional `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and `NOTIFICATION_EMAIL` values to enable staff notifications and applicant confirmations.
7. Deploy, then use the assigned `https://feduwo-agri-firm.onrender.com` address. If Render assigns a different address, update `CLIENT_ORIGIN` and `SITE_URL` to that exact origin and redeploy.

The free Render plan may spin down an idle service and is intended for initial previews, not guaranteed uptime. Choose an always-on plan for a production business site. MongoDB Atlas hosting and data-retention/backup policies are configured separately from Render.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Express listening port (default `5000`) |
| `NODE_ENV` | Runtime environment |
| `CLIENT_ORIGIN` | Comma-separated allowed browser origins |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signing secret, minimum 32 characters |
| `JWT_EXPIRES_IN` | JWT lifetime (default `8h`) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial administrator setup; password must be at least 12 characters |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Optional SMTP delivery settings |
| `NOTIFICATION_EMAIL` | Recipient for website notifications |
| `SITE_URL` | Canonical deployment origin, used by the sitemap |
| `VITE_API_URL` | Optional API base URL for a separately deployed client |

## API overview

Public endpoints:

- `POST /api/auth/login` — administrator sign-in (rate limited)
- `POST /api/consultations` — consultation request
- `POST /api/enquiries` — contact enquiry
- `GET /api/training` and `POST /api/training/register`
- `GET /api/jobs` and `POST /api/jobs/:id/applications` (multipart; resume required, PDF/DOC/DOCX, maximum 5 MB per file)
- `GET /api/articles`, `GET /api/articles/:slug`
- `GET /api/projects` — published, verified projects only
- `POST /api/newsletter`
- `GET /api/health`

Protected endpoints require `Authorization: Bearer <JWT>`:

- `GET /api/admin/dashboard`
- `GET|POST /api/admin/users`, `PATCH /api/admin/users/:id` (admin role)
- `GET|POST /api/admin/:resource`, `PATCH|DELETE /api/admin/:resource/:id`
- `GET /api/admin/applications/:id/documents/:filename` — authorized document download

Admin resources include consultations, enquiries, training, registrations, jobs, applications, articles, projects, subscribers and activities. Project publishing is limited to administrators; project pages show only verified records. Deletion is limited to administrators.

## Security and privacy

- Passwords use bcrypt hashing; public account creation is disabled.
- JWTs expire and protected APIs re-check that the user is active.
- API request limits, login-specific rate limiting, Helmet, CORS allowlisting, JSON size limits, schema validation and unique indexes are enabled.
- Applicant documents are stored outside the static web root, signature-checked, and require an authenticated administrator session to download.
- Do not deploy the example environment values. Use TLS, rotate credentials, restrict database network access, back up data securely, and configure an upload-retention/deletion process.
- The site collects personal information for replies, registrations and recruitment. Configure a privacy notice and retention practices for the organization, limit access to authorized staff, and obtain Kenya-specific legal advice to ensure compliance with the Data Protection Act, 2019. This starter is not a legal compliance certification.

## Content and launch checklist

- Supplied contact details and logo are included. No office address, testimonials, biographies, qualifications, registrations, projects, results, vacancy or course schedules have been invented.
- Add verified programmes, vacancies, articles and projects through the authenticated admin API/dashboard. Project results must be verified before publication.
- Configure the actual domain in `SITE_URL` (used by `robots.txt` and the dynamic XML sitemap), SMTP credentials, MongoDB backups, deployment secrets and production CORS origin.
- Replace or review the general privacy and terms text with company-approved legal copy.
- Stock photography is remotely loaded from Unsplash; replace with licensed company photography for final brand launch.
