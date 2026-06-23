# IIS Deployment Guide

## Community Outreach & Volunteer Management System

### Prerequisites

- Windows Server 2019 or 2022
- IIS 10 with URL Rewrite Module 2.1+
- Application Request Routing (ARR) 3.0+
- Node.js 20 LTS (installed on the server)
- PostgreSQL 15+ (installed and running)

---

## 1. PostgreSQL Setup

1. Install PostgreSQL and create the database:
   ```sql
   CREATE DATABASE volunteer_mgmt;
   CREATE USER vms_user WITH PASSWORD 'StrongPassword!';
   GRANT ALL PRIVILEGES ON DATABASE volunteer_mgmt TO vms_user;
   ```

2. Note the connection string:
   ```
   postgresql://vms_user:StrongPassword!@localhost:5432/volunteer_mgmt
   ```

---

## 2. Application Setup

1. Copy the project folder to the server (e.g., `C:\Apps\VolunteerManagementSystem`).

2. Create the environment file:
   ```
   Copy .env.example to .env.local
   ```
   Fill in:
   ```env
   DATABASE_URL="postgresql://vms_user:StrongPassword!@localhost:5432/volunteer_mgmt"
   AUTH_SECRET="<run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">"
   AUTH_URL="https://yourdomain.internal"
   NEXT_PUBLIC_APP_URL="https://yourdomain.internal"
   NODE_ENV="production"
   ```

3. Install dependencies and build:
   ```powershell
   cd C:\Apps\VolunteerManagementSystem
   npm install
   npm run db:generate
   npm run db:push        # or: npm run db:migrate:deploy for migrations
   npm run db:seed        # seeds admin account and demo data
   npm run build
   ```

4. After `npm run build`, the standalone output is at `.next/standalone/`.

---

## 3. IIS Configuration

### Enable ARR Proxy

1. Open IIS Manager → Server level → **Application Request Routing Cache**
2. Click **Server Proxy Settings** on the right panel
3. Check **Enable proxy** → Apply

### Create the IIS Site

1. In IIS Manager, right-click **Sites** → **Add Website**
   - Site name: `VolunteerManagementSystem`
   - Physical path: `C:\Apps\VolunteerManagementSystem`
   - Binding: port 443 (HTTPS) or 80 for internal HTTP

2. Set the Application Pool:
   - .NET CLR version: **No Managed Code**
   - Pipeline mode: **Integrated**

### URL Rewrite Rules

The `web.config` at the project root contains the URL Rewrite rules that proxy
requests to the Next.js server running on port 3000. Ensure the file is present
at `C:\Apps\VolunteerManagementSystem\web.config`.

---

## 4. Run Next.js as a Windows Service

Use **NSSM** (Non-Sucking Service Manager) to keep the Node process running.

1. Download NSSM from https://nssm.cc and place `nssm.exe` in `C:\Tools\`.

2. Create the service:
   ```powershell
   C:\Tools\nssm.exe install VMS-NextJS
   ```
   In the NSSM GUI:
   - **Path**: `C:\Program Files\nodejs\node.exe`
   - **Startup directory**: `C:\Apps\VolunteerManagementSystem\.next\standalone`
   - **Arguments**: `server.js`
   - **Environment**: Add these on the Environment tab (one per line):
     ```
     PORT=3000
     NODE_ENV=production
     DATABASE_URL=postgresql://vms_user:StrongPassword!@localhost:5432/volunteer_mgmt
     AUTH_SECRET=<your-secret>
     AUTH_URL=https://yourdomain.internal
     ```

3. Start the service:
   ```powershell
   C:\Tools\nssm.exe start VMS-NextJS
   ```

4. Verify it's running:
   ```powershell
   Invoke-WebRequest http://localhost:3000 -UseBasicParsing
   ```

---

## 5. Static Assets

Next.js standalone output does not include static files by default.
Copy them to the standalone directory after each build:

```powershell
$src = "C:\Apps\VolunteerManagementSystem\.next\standalone"
Copy-Item -Recurse -Force "C:\Apps\VolunteerManagementSystem\.next\static" "$src\.next\static"
Copy-Item -Recurse -Force "C:\Apps\VolunteerManagementSystem\public" "$src\public"
```

---

## 6. Upload Directory

Ensure the uploads directory exists and is writable:

```powershell
New-Item -ItemType Directory -Force "C:\Apps\VolunteerManagementSystem\public\uploads"
icacls "C:\Apps\VolunteerManagementSystem\public\uploads" /grant "IIS_IUSRS:(OI)(CI)F"
```

---

## 7. Redeployment

For updates:

```powershell
cd C:\Apps\VolunteerManagementSystem
git pull          # or copy updated files
npm install
npm run db:migrate:deploy   # run any new migrations
npm run build

# Copy static assets
$src = ".next\standalone"
Copy-Item -Recurse -Force ".next\static" "$src\.next\static"
Copy-Item -Recurse -Force "public" "$src\public"

# Restart the service
C:\Tools\nssm.exe restart VMS-NextJS
```

---

## 8. Default Admin Credentials

After seeding:

| Email | Password |
|---|---|
| `admin@department.gov` | `Admin@123!` |

**Change the admin password immediately after first login.**

Demo employees use password: `TempPass@123!`

---

## 9. Firewall

Only port 443 (or 80) needs to be open externally.
Port 3000 (Node.js) should be blocked at the firewall — IIS proxies to it internally.

```powershell
# Block external access to port 3000
New-NetFirewallRule -DisplayName "Block Node Direct" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Block
```
