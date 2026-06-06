# Deploy Marvel Rocks (MyGate Society) on Azure — from scratch

This guide deploys your app to **Azure** and connects your **Hostinger** domain **`marvelrocks.in`**.

| Part | Azure service | URL |
|------|---------------|-----|
| React UI | Azure Static Web Apps | `https://www.marvelrocks.in` |
| FastAPI API | Azure App Service (Linux, Docker) | `https://api.marvelrocks.in` |
| SQL Server | Azure SQL Database | (private — no public URL) |

**Time:** ~2–3 hours the first time  
**Cost after free trial:** roughly **₹1,500–3,500/month** (SQL + App Service; Static Web Apps free tier is enough to start)

---

## Before you start

- [ ] Azure account — [https://azure.microsoft.com/free](https://azure.microsoft.com/free) ($200 credit for 30 days)
- [ ] GitHub repo pushed: [https://github.com/atchyut96379/MyGateSociety](https://github.com/atchyut96379/MyGateSociety)
- [ ] Domain **`marvelrocks.in`** on Hostinger (DNS access in hPanel)
- [ ] Razorpay **live** keys (when you go live with payments)
- [ ] Install locally (for one-time DB setup):
  - [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (to build API image)

---

## Architecture

```
Browser
   │
   ├─► www.marvelrocks.in  ──► Azure Static Web Apps (React build from /web)
   │
   └─► api.marvelrocks.in  ──► Azure App Service (FastAPI Docker from /python_app)
                                      │
                                      └─► Azure SQL Database (mygatesociety)
```

Hostinger only points DNS at Azure. You do **not** host the app on Hostinger servers.

---

## Phase 1 — Azure basics (10 min)

### 1.1 Sign in

1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Sign in with your Microsoft account

### 1.2 Create a resource group

1. Search **Resource groups** → **Create**
2. **Subscription:** your subscription  
3. **Resource group:** `rg-marvelrocks-prod`  
4. **Region:** **Central India** (or South India — pick one and use it everywhere)  
5. **Create**

---

## Phase 2 — Azure SQL Database (30 min)

### 2.1 Create SQL server + database

1. Search **SQL databases** → **Create**
2. **Resource group:** `rg-marvelrocks-prod`
3. **Database name:** `mygatesociety`
4. **Server:** Create new  
   - **Server name:** `marvelrocks-sql` (must be globally unique → e.g. `marvelrocks-sql-96379`)  
   - **Location:** same as resource group  
   - **Authentication:** **Use SQL authentication**  
   - **Admin login:** `sqladmin`  
   - **Password:** strong password (save it — e.g. in a password manager)
5. **Compute + storage:** **Basic** (5 DTU) for pilot — upgrade later if slow
6. **Create**

Wait until deployment finishes.

### 2.2 Firewall (allow Azure + your PC)

1. Open the SQL **server** (not only the database) → **Networking**
2. **Public access:** Enabled  
3. **Allow Azure services and resources to access this server:** **Yes**
4. **Add your client IP** (your home/office IP for setup from SSMS or Azure Cloud Shell)
5. **Save**

### 2.3 Connection string (for later)

Format for this app (`pymssql`):

```
mssql+pymssql://sqladmin:YOUR_PASSWORD@marvelrocks-sql-96379.database.windows.net:1433/mygatesociety
```

**Important:** If the password contains `@`, `#`, `!`, etc., [URL-encode](https://www.urlencoder.org/) it in the connection string.  
Example: `MyP@ss!` → `MyP%40ss%21`

### 2.4 Create tables and seed data

**Option A — From your PC (if you have SSMS or Azure Data Studio)**

1. Connect to `marvelrocks-sql-96379.database.windows.net` as `sqladmin`
2. Database `mygatesociety` is already created by Azure
3. Tables are created automatically when you run seed (recommended)

**Option B — Run seed from your machine (recommended)**

```powershell
cd D:\Projects\MyGateSociety\python_app

# Temporary .env for one-time setup (do NOT commit)
# Copy .env.example and set:
#   DATABASE_URL=mssql+pymssql://sqladmin:...@....database.windows.net:1433/mygatesociety
#   ENVIRONMENT=production
#   JWT_SECRET=<long random string, 32+ chars>

.\.venv\Scripts\Activate.ps1   # or: python -m venv .venv && pip install -r requirements.txt
python -m app.seed
```

First login after seed: **Admin** / **admin** (change immediately in the app).

**Option C — Azure Cloud Shell**

Upload project or clone from GitHub in Cloud Shell, install deps, run `python -m app.seed` with `DATABASE_URL` set.

---

## Phase 3 — API on App Service (45 min)

### 3.1 Container Registry (store Docker image)

1. Search **Container registries** → **Create**
2. **Resource group:** `rg-marvelrocks-prod`
3. **Registry name:** `marvelrocksacr` (unique, lowercase, no spaces)
4. **SKU:** Basic
5. **Create**

### 3.2 Build and push API image

On your PC (PowerShell), from the repo root:

```powershell
cd D:\Projects\MyGateSociety\python_app

# Log in to Azure and ACR (replace names if yours differ)
az login
az acr login --name marvelrocksacr

# Build and push
docker build -t marvelrocksacr.azurecr.io/mygate-api:latest .
docker push marvelrocksacr.azurecr.io/mygate-api:latest
```

### 3.3 Create App Service (Linux container)

1. Search **App Services** → **Create**
2. **Resource group:** `rg-marvelrocks-prod`
3. **Name:** `marvelrocks-api` → URL will be `https://marvelrocks-api.azurewebsites.net`
4. **Publish:** **Docker Container**
5. **Operating System:** Linux
6. **Region:** Central India
7. **Linux Plan:** Create new → **B1** (Basic) for production pilot
8. **Next: Docker**
   - **Options:** Single Container
   - **Image source:** Azure Container Registry
   - Select your registry, image `mygate-api`, tag `latest`
9. **Create**

### 3.4 App Service environment variables

App Service → **marvelrocks-api** → **Settings** → **Environment variables** (or **Configuration** → **Application settings**):

| Name | Value |
|------|--------|
| `DATABASE_URL` | `mssql+pymssql://sqladmin:...@....database.windows.net:1433/mygatesociety` |
| `JWT_SECRET` | Long random string (32+ characters) — **not** `change-this-in-production` |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | `https://www.marvelrocks.in,https://marvelrocks.in` |
| `RAZORPAY_KEY_ID` | Your Razorpay key |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret |
| `WEBSITES_PORT` | `8000` |

**Save** and **Restart** the app.

### 3.5 Verify API

Open in browser:

```
https://marvelrocks-api.azurewebsites.net/docs
```

You should see FastAPI Swagger. Try **POST /auth/login** with your seeded admin (only over HTTPS in production).

### 3.6 Custom domain `api.marvelrocks.in`

1. App Service → **Custom domains** → **Add custom domain**
2. Domain: `api.marvelrocks.in`
3. Azure shows a **CNAME** or **TXT** validation record — keep this page open
4. Configure DNS at Hostinger (Phase 5), then **Validate** in Azure
5. **Add binding** → enable **HTTPS** with **App Service Managed Certificate** (free)

After DNS propagates (5 min – 48 hrs, usually &lt; 1 hour):

```
https://api.marvelrocks.in/docs
```

### 3.7 Redeploy API after code changes

```powershell
cd D:\Projects\MyGateSociety\python_app
docker build -t marvelrocksacr.azurecr.io/mygate-api:latest .
docker push marvelrocksacr.azurecr.io/mygate-api:latest
```

App Service → **Deployment Center** → restart, or enable **Continuous Deployment** from ACR.

---

## Phase 4 — React UI on Static Web Apps (30 min)

### 4.1 Production API URL for the build

The web app reads the API URL at **build time**:

```powershell
cd D:\Projects\MyGateSociety\web
copy .env.production.example .env.production
```

Edit `.env.production`:

```
VITE_API_URL=https://api.marvelrocks.in
```

Use your real API URL (custom domain or `*.azurewebsites.net` until DNS is ready).

### 4.2 Create Static Web App (GitHub — recommended)

1. Search **Static Web Apps** → **Create**
2. **Resource group:** `rg-marvelrocks-prod`
3. **Name:** `marvelrocks-web`
4. **Plan:** Free (OK for society pilot)
5. **Region:** Central India (or closest available)
6. **Deployment source:** GitHub → authorize → repo **MyGateSociety**, branch **main**
7. **Build details:**
   - **App location:** `web`
   - **Api location:** *(leave empty)*
   - **Output location:** `dist`
8. **Create**

Azure adds a GitHub Actions workflow under `.github/workflows/`.

### 4.3 Set `VITE_API_URL` in GitHub Actions

Edit the workflow file Azure created (name like `azure-static-web-apps-*.yml`).

In the **build** step, add env:

```yaml
env:
  VITE_API_URL: https://api.marvelrocks.in
```

Commit and push — the workflow rebuilds and deploys the UI.

**Manual build (without GitHub):**

```powershell
cd D:\Projects\MyGateSociety\web
npm ci
npm run build
npx @azure/static-web-apps-cli deploy ./dist --deployment-token <TOKEN>
```

Token: Static Web App → **Manage deployment token**.

### 4.4 Verify UI

Default URL:

```
https://<random-name>.azurestaticapps.net
```

Log in with your society admin account.

### 4.5 Custom domains `www` and apex

1. Static Web App → **Custom domains** → **Add**
2. Add **`www.marvelrocks.in`** (CNAME to your `*.azurestaticapps.net` hostname)
3. Add **`marvelrocks.in`** (apex) — Azure shows required **ALIAS/ANAME** or **A** record instructions

Enable **HTTPS** (managed certificate) for each domain in the Azure portal.

---

## Phase 5 — Hostinger DNS for `marvelrocks.in`

1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com)
2. **Domains** → **marvelrocks.in** → **DNS / DNS Zone**
3. Add or edit records (remove conflicting old records if needed):

| Type | Name / Host | Value | TTL |
|------|-------------|--------|-----|
| **CNAME** | `www` | `<your-app>.azurestaticapps.net` | 3600 |
| **CNAME** | `api` | `marvelrocks-api.azurewebsites.net` | 3600 |
| **ALIAS** or **ANAME** | `@` | Azure SWA apex target *(from Azure custom domain wizard)* | 3600 |

If Hostinger has no ALIAS for apex:

- Use **Domain forwarding**: `marvelrocks.in` → `https://www.marvelrocks.in`, **or**
- Add the **A record** IP(s) Azure gives for Static Web Apps apex validation

4. For domain **validation**, Azure may ask for a **TXT** record — add exactly as shown in the portal
5. Wait for DNS propagation (use [https://dnschecker.org](https://dnschecker.org))

**Do not** point `api` to Hostinger hosting — only CNAME to Azure App Service.

---

## Phase 6 — Production checklist

### Security

- [ ] Change default **Admin** password after first login
- [ ] Strong `JWT_SECRET` in App Service only (never in Git)
- [ ] `ENVIRONMENT=production`
- [ ] `CORS_ORIGINS` lists only your real frontend URLs (not `*`)
- [ ] Razorpay **live** keys when accepting real money
- [ ] SQL firewall: remove temporary “client IP” rules you no longer need

### Razorpay

In [Razorpay Dashboard](https://dashboard.razorpay.com) → **Settings** → **Webhooks** (if you add webhooks later):

- Allowed origins / redirect URLs should include `https://www.marvelrocks.in`

### Monitoring

- App Service → **Log stream** (runtime errors)
- App Service → **Application Insights** (optional, recommended)
- Azure SQL → **Query Performance Insight**

### Backups

- Azure SQL → **Automated backups** (enabled by default on paid tiers)
- Consider **geo-redundant backup** for production

---

## Phase 7 — Ongoing operations

| Task | How |
|------|-----|
| Update API | `docker build` + `docker push` → restart App Service |
| Update UI | `git push` to `main` (GitHub Actions) or `swa deploy` |
| View API logs | App Service → Log stream / Log Analytics |
| DB access | Azure Data Studio / SSMS with firewall rule |
| Scale up | SQL tier or App Service plan when users grow |

### Run seed again (careful)

```powershell
# Wipes data if --reset — production danger
python -m app.seed --reset
```

Only run `--reset` on a fresh empty database.

---

## Troubleshooting

### UI loads but login fails / network error

- Browser **F12** → Network: requests should go to `https://api.marvelrocks.in/...`
- If they go to `/api` on the wrong host, `VITE_API_URL` was not set at build time — fix `.env.production` / GitHub Actions env and redeploy

### CORS error in browser

- Set `CORS_ORIGINS` on App Service to include exact origin (`https://www.marvelrocks.in`)
- Restart App Service after changing settings

### API 500 / database errors

- Check `DATABASE_URL` (URL-encoded password, correct server name)
- SQL firewall: **Allow Azure services** = Yes
- Log stream on App Service for Python traceback

### `pymssql` / connection timeout

- Confirm port `1433` in connection string
- Server name must be `*.database.windows.net`

### Custom domain not validating

- Wait 15–60 minutes after DNS change
- TXT/CNAME must match Azure portal exactly (no trailing dots in Hostinger value field unless required)

### Docker build fails on Windows

- Ensure Docker Desktop is running
- Build from `python_app` folder (where `Dockerfile` lives)

---

## Cost summary (approximate)

| Resource | Tier | ~USD/month |
|----------|------|------------|
| Static Web Apps | Free | $0 |
| App Service Linux | B1 | ~$13 |
| Azure SQL | Basic | ~$5 |
| Container Registry | Basic | ~$5 |
| **Total** | | **~$23/month** |

Free trial **$200 credit** covers several months at this size. Set **Budget alerts** in Azure Cost Management.

---

## Quick reference — URLs

| Service | URL |
|---------|-----|
| Society app (users) | https://www.marvelrocks.in |
| API docs (admins/dev) | https://api.marvelrocks.in/docs |
| Azure portal | https://portal.azure.com |
| Hostinger DNS | https://hpanel.hostinger.com |

---

## Files in this repo for deployment

| File | Purpose |
|------|---------|
| `python_app/Dockerfile` | API container for App Service |
| `web/.env.production.example` | `VITE_API_URL` for production build |
| `web/staticwebapp.config.json` | SPA routing on Static Web Apps |
| `web/src/api/client.ts` | Uses `VITE_API_URL` when set |

For local development, nothing changes: API stays at `/api` via Vite proxy.
