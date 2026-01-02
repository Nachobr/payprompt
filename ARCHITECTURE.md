# System Architecture

## Overview

PayPrompt is a decentralized application (dApp) connecting a React frontend with Supabase backend services and EVM blockchain networks.

```mermaid
graph TD
    User((User))
    
    subgraph Client ["Frontend (React + Vite)"]
        UI[User Interface]
        Wallet[RainbowKit / Wagmi]
        Auth[SIWE Logic]
    end

    subgraph Backend ["Supabase Services"]
        Edge[Edge Functions (Deno)]
        DB[(PostgreSQL)]
        AuthService[Supabase Auth]
    end

    subgraph Blockchain ["Base Network"]
        RPC[RPC Node]
        MNEE[MNEE Token Contract]
    end

    User --> UI
    UI --> Wallet
    Wallet -->|Sign Messages/Tx| User
    
    %% Authentication Flow
    Wallet -->|SIWE Signature| Edge
    Edge -->|Verify| AuthService
    Edge -->|Store Session| DB
    
    %% Prompt Flow
    UI -->|Prompt Request| Edge
    Edge -->|Deduct Credit| DB
    Edge -->|Process LLM| OpenAI[AI Provider]
    
    %% Payment Flow
    Wallet -->|Approve/Permit| RPC
    RPC --> MNEE
    Edge -->|Verify Deposit| RPC
    Edge -->|Credit Account| DB
```

## Core Components

### 1. Frontend Layer
- **Framework**: React 18 built with Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Web3**: 
  - `wagmi`: React hooks for Ethereum
  - `RainbowKit`: Wallet connection UI
  - `viem`: Low-level blockchain interface

### 2. Backend Layer (Supabase)
- **Edge Functions**: Server-side logic running on Deno.
  - `verify-siwe`: Handles Sign-In with Ethereum authentication.
  - `process-prompt`: Manages AI request processing and credit deduction.
  - `verify-deposit`: Monitors blockchain for payments (if applicable).
- **Database**: PostgreSQL for user profiles, transaction history, and prompt logs.

### 3. Blockchain Layer
- **Network**: Base (Coinbase L2)
- **Currency**: MNEE Stablecoin
- **Mechanisms**: Gasless relays and EIP-2612 permits for interactions.


## Directory Structure

```
/
├── pay-per-prompt/         # Frontend Application
│   ├── src/
│   │   ├── components/     # UI Components (Shadcn)
│   │   ├── lib/            # Utilities & Config
│   │   └── hooks/          # Custom React Hooks
│   ├── public/
│   └── index.html
├── supabase/               # Backend Configuration
│   ├── functions/          # Deno Edge Functions
│   ├── migrations/         # Database Schema
│   └── config.toml
└── docs/                   # Documentation
```

## Recommendations for Visual Clarity

To make the project even easier to understand and maintain:

1.  **Shared Types**: Generate Database types using Supabase CLI and store them in a shared location (e.g., `pay-per-prompt/src/types/supabase.ts`) so both frontend and potential future backend scripts share the exact same data contracts.
2.  **Explicit Edge Function Interfaces**: Create a standard request/response type definition file for Edge Functions to clearly document the API surface area.
3.  **Diagrams as Code**: Keep this `ARCHITECTURE.md` updated with Mermaid diagrams. This allows the documentation to evolve alongside the code commits.
