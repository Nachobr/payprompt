# Pay-Per-Prompt Installation Guide

This project consists of a React frontend and a Supabase backend with Edge Functions for AI processing and credit management.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (installed with Node.js)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## 1. Frontend Setup

The frontend is located in the `pay-per-prompt` directory.

1.  **Navigate to the directory:**
    ```bash
    cd pay-per-prompt
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

---

## 2. Supabase Backend Setup

The backend logic resides in Supabase Edge Functions.

1.  **Login to Supabase:**
    ```bash
    supabase login
    ```

2.  **Initialize/Link your project:**
    ```bash
    supabase link --project-ref your-project-id
    ```

3.  **Deploy Edge Functions:**
    From the root directory:
    ```bash
    supabase functions deploy process-prompt
    supabase functions deploy verify-siwe
    supabase functions deploy gasless-relay
    ```

4.  **Database Migrations:**
    Apply the migrations and setup the tables:
    ```bash
    supabase db push
    ```

---

## 3. Environment Variables & Secrets

### Frontend (`pay-per-prompt`)
The project uses hardcoded values for `supabaseUrl` and `supabaseAnonKey` in `src/lib/supabase.ts` for demo purposes. To use your own:
1.  Update `src/lib/supabase.ts` with your Supabase credentials.

### Supabase Edge Functions
Set the following secrets in your Supabase project:
```bash
supabase secrets set GROQ_API_KEY=your_key_here
supabase secrets set SUPABASE_URL=your_project_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 4. Key Components

- **Smart Contract**: Located in `docs/MNEEVault.sol`. Used for MNEE deposits on the Base chain (Chain ID 8453).
- **Edge Functions**: Handle credit deduction and AI calls securely on the server-side.
- **Frontend**: Built with React, Vite, Tailwind CSS, and Shadcn UI.
