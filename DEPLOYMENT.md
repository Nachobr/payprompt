# Production Deployment Guide (MNEE Vault)

This guide walks you through deploying the `MNEEVault.sol` smart contract to the Base network using Remix IDE and configuring your Pay-Per-Prompt application to use it.

## Prerequisites

1.  **MetaMask**: Installed and connected to the **Base Mainnet**.
2.  **MNEE Tokens**: You need valid MNEE tokens (`0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFB6cF`) for testing.
3.  **ETH on Base**: A small amount of ETH for gas fees to deploy the contract.
4.  **Relayer Wallet**: A dedicated wallet address (private key) that will act as the "Relayer" for the backend.

---

## Step 1: Prepare the Relayer Wallet

The "Relayer" is the backend service that executes gasless transactions on behalf of users.
1.  Create a **new, fresh wallet** in MetaMask (or generate a new account).
2.  **Copy its address** (e.g., `0xRelayerAddress...`).
3.  **Export its Private Key** (Settings -> Security & Privacy -> Show Private Key).
    *   *Security Note: Never use your main personal wallet for this. Use a dedicated operational wallet.*
4.  Send a small amount of ETH (~$5-10) to this Relayer address on Base so it can pay for gas fees.

---

## Step 2: Deploy Smart Contract via Remix

1.  Open [Remix IDE](https://remix.ethereum.org/).
2.  **Create File**:
    *   In the "File Explorer" (left sidebar), click the "New File" icon.
    *   Name it `MNEEVault.sol`.
    *   Copy/Paste the entire content of `docs/MNEEVault.sol` from your project.
3.  **Compile**:
    *   Go to the "Solidity Compiler" tab (3rd icon).
    *   Select Compiler Version: `0.8.20` (or matching the `pragma` in the file).
    *   Click "Compile MNEEVault.sol".
4.  **Deploy**:
    *   Go to the "Deploy & Run Transactions" tab (4th icon).
    *   Environment: Select **"Injected Provider - MetaMask"**.
    *   Verify that your MetaMask pops up and is connected to **Base**.
    *   **Constructor Arguments**:
        *   `_mneeToken`: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFB6cF` (Official MNEE Address on Base).
        *   `_relayer`: Paste your **Relayer Wallet Address** from Step 1.
    *   Click **Transact** (Deploy).
    *   Confirm the transaction in MetaMask.
5.  **Save Address**:
    *   Once confirmed, you will see "Deployed Contracts" at the bottom.
    *   Copy the address of your new `MNEEVault` (e.g., `0xYourVaultAddress...`).

---

## Step 3: Configure Supabase Backend

You need to tell your backend where the Vault is and give it permission (via the Private Key) to relay transactions.

Run the following commands in your terminal (root directory):

```bash
# 1. Set the Vault Address (Where funds are sent)
npx supabase secrets set VAULT_ADDRESS="0xYourVaultAddress..."

# 2. Set the Relayer Address (The public address of your relayer wallet)
npx supabase secrets set RELAYER_ADDRESS="0xRelayerAddress..."

# 3. Set the Relayer Private Key (So the backend can sign transactions)
npx supabase secrets set RELAYER_PRIVATE_KEY="your_exported_private_key_here"
```

*Note: Ensure `npx supabase` is linked to your remote project (`padmuyarkazfjxtjiohl`).*

---

## Step 4: Verify Functionality

1.  **Restart your local frontend**: `npm run dev`.
2.  **Connect Wallet**: Use a user wallet (NOT the relayer wallet) that has MNEE.
3.  **Top Up**: Try to deposit MNEE.
    *   The frontend will ask you to sign a "Permit" (off-chain signature).
    *   It will verify the signature.
    *   The backend (Relayer) will then submit the transaction on-chain.
    *   If you see "Insufficient Credits" turn into a positive balance, **Success!**

## Troubleshooting

-   **"Transfer Failed"**: Ensure the user has enough MNEE approved or that the permit was valid.
-   **"Gasless relay error"**: Check the Supabase Edge Function logs (`npx supabase functions logs`) to see if the transaction reverted on-chain (e.g., due to lack of ETH in the Relayer wallet).
