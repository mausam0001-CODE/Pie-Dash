# Pie Pro Social Dashboard — Production Setup 🚀

Pie Pro is a modern, enterprise-ready social media dashboard built with React, Node.js, and Supabase.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, TanStack Query, React Router 6.
- **Backend**: Node.js, Express, MVC Architecture.
- **Database**: Supabase (PostgreSQL) with Realtime and Row Level Security.
- **Security**: AES-256-CBC token encryption, JWT-based authentication.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Supabase project

### 2. Environment Configuration
Create a `.env.local` file in the root directory with the following:

```env
# Supabase (Found in Project Settings > API)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Security
ENCRYPTION_KEY=your_64_char_hex_key
FRONTEND_URL=http://localhost:5173

# Meta / Facebook OAuth
FB_APP_ID=your_facebook_app_id
FB_APP_SECRET=your_facebook_app_secret
```

> [!TIP]
> Generate your `ENCRYPTION_KEY` using:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Database Setup (Supabase)
Run the SQL found in these files within your Supabase SQL Editor:
1. `supabase_schema.sql`: Initializes the tables.
2. `rls_policies.sql`: Enables data isolation and security.

### 4. Installation
```powershell
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 5. Running the App
```powershell
# Start the frontend
npm run dev

# Start the backend (in a separate terminal)
cd server
node index.js
```

## 🛡️ Security & Architecture
- **JWT Middleware**: Every API request is checked against your Supabase session.
- **Token Vault**: All social media access tokens are encrypted server-side before storage.
- **MVC Pattern**: The server is organized into Routes, Controllers, and Services for clean separation of concerns.
- **Real-time Sync**: The dashboard and workflow views update automatically when data changes in the database.

---
Built with ❤️ by the Pie Pro Team.
