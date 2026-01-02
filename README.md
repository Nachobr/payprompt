# PayPrompt

### Pay-Per-Prompt is a micropayment-powered AI playground using MNEE stablecoin on Base, enabling gasless, sub-cent prompt processing for a seamless user experience.

## Project Story
As a solo developer, I set out to solve the "subscription fatigue" and high entry barriers of premium AI services. By combining the efficiency of the Base L2 with MNEE stablecoin micropayments, PayPrompt creates a frictionless "pay-as-you-go" model for AI interaction.

## Inspiration
I was inspired by the power of Bitcoin's original vision of micropayments and how Layer 2 solutions like Base finally make sub-cent transactions viable. I wanted to create a bridge between decentralized finance and AI utility that anyone could use without worrying about gas fees.

## What it does
PayPrompt allows users to connect their wallet, deposit MNEE stablecoins, and pay only for the prompts they use. It features:
- **Gasless Experience**: Transactions are relayed to handle the underlying blockchain complexity for the user.
- **Sub-Cent Pricing**: Prompts cost as little as $0.05 - $0.10 MNEE.
- **Secure Authentication**: Sign-In with Ethereum (SIWE) ensures a decentralized yet secure user session.

## How we built it
The project is built on a modern stack:
- **Frontend**: React and Vite for a fast, responsive UI, styled with Tailwind CSS and Shadcn.
- **Connectivity**: RainbowKit and Wagmi for a premium wallet connection experience.
- **Backend/API**: Supabase Edge Functions (Deno) for secure, server-side AI processing and credit management.
- **Blockchain**: The Base network (Chain ID 8453) using MNEE stablecoins for stable value transfer.

## Challenges we ran into
Building a gasless relay required fine-tuning the balance between the Edge Functions and smart contract permits. Additionally, handling SIWE verification manually within the Edge Functions to avoid heavy external dependencies was a technical hurdle that required building a custom parser.

## Accomplishments that we're proud of
I'm particularly proud of achieving a completely gasless-feeling experience for the end user and successfully integrating the MNEE permit system for seamless deposits.

## What we learned
I deepened my understanding of EIP-2612 permits, SIWE verification flows, and how to optimize Deno Edge Functions for low-latency AI responses.

## What's next for payprompt
- **Multimodal Support**: Adding image and audio prompt processing.
- **Prompt Marketplace**: Allowing users to sell high-performing prompts for MNEE.
- **Mobile Integration**: A dedicated mobile experience via PWA or native wrappers.

## Built with
- **Languages**: TypeScript, HTML, CSS, Solidity
- **Frameworks**: React, Vite, Deno
- **Platforms/Cloud**: Supabase, Base Network, Reown (WalletConnect)
- **APIs**: OpenAI API, Alchemy/Infura RPCs
- **Libraries**: RainbowKit, Wagmi, viem, Tailwind CSS, Shadcn UI
