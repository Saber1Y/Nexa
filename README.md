# Nexa - Machine-Payable AI Services on BOT Chain

Nexa is an AI-service marketplace that agents pay for per call over HTTP `402 Payment Required` (x402 v2).
A buyer agent sends a request, gets challenged with a payment requirement, signs a payment authorization, settles USDT atomically on BOT Chain Mainnet, receives the AI result, and can independently verify the result hash that was anchored on-chain.

One real paid service runs end to end today: `resume-intelligence-v1` (candidate/resume intelligence audit).

Everything in this repository was verified against BOT Chain Mainnet (chain id `677`).
Nothing is mocked in the payment path: the settlement transaction, the receipt transaction, and the receipt lookup are real on-chain calls.

Live deployment: https://nexa-ai-bridge-kappa.vercel.app
The Vercel project is connected to `https://github.com/Saber1Y/Nexa`, so every push to `main` deploys the app.

### Mainnet proof

- Chain ID: `677`
- Registry Address: `0x6Ae462BC2AeA78b41aB638cADd18af6cf40cDF72`
- Latest Receipt: `0x74e309a43cabf660...` (`saveStrategy`)
- Built on [BOT Chain](https://botchain.ai)
- Follow [@use_auralens on X](https://x.com/use_auralens)

## Payment protocol

The server is the source of truth for the protocol, implemented in `src/botX402.mjs`.

1. `POST /api/audit` without payment returns `402` with a `PAYMENT-REQUIRED` header (base64url JSON: `x402Version`, `accepts[]`, `extensions`).
2. The client signs the configured payment authorization for BOT Chain Mainnet (`chainId 677`) for the exact price in atomic USDT units.
3. The client retries with a `PAYMENT-SIGNATURE` header (base64url JSON: `x402Version`, `resource`, `accepted`, `payload.signature`, `payload.permit2Authorization`).
4. The server verifies the typed-data signature, the payer balance, and the token allowance, then settles through the x402 exact-token Permit2 settlement proxy on BOT Chain.
5. Only after settlement succeeds does the AI service execute.
6. The result hash is recorded in `NexaReceiptRegistry` on-chain, and the response returns `PAYMENT-RESPONSE` (settlement JSON) plus the receipt transaction.

Replay protection comes from Permit2 nonces enforced on-chain: an already-used payload is rejected with `409 duplicate_payment` from the in-memory cache during runtime, and with a settlement revert (`402 settlement_failed`) after a restart.

All monetary values are integers in atomic units (`tUSDT` has 6 decimals), never floating point.

## Architecture

```text
buyer agent (scripts/customer-agent-demo.mjs or frontend src/hooks/useX402Bot.ts)
  -> POST /api/audit                 x402 challenge / signed payment / result
Express server (src/server.mjs)
  |- src/botX402.mjs                402 headers, Permit2 witness verify, settlement
  |- src/aiAdapter.mjs              runAudit() -> llm (default) | genlayer (preserved)
  |- src/upstreamX402.mjs           paid upstream LLM call (EIP-3009, Base USDC)
  |- src/receipts.mjs               record + read on-chain receipts
  |- src/serviceRegistry.mjs        registered services + prices
  |- src/botConfig.mjs              chain / token / Permit2 / proxy / registry config
BOT Chain Mainnet (chain id 677, RPC https://rpc.botchain.ai)
   |- USDT 0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C (6 decimals)
  |- Permit2 0x000000000022D473030F116dDEE9F6B43aC78BA3 (canonical, witness path)
  |- x402 exact Permit2 proxy 0x402085c248EeA27D92E8b30b2C58ed07f9E20001
   |- NexaServiceRegistry 0x4d5845487a11491575aFE5E63554E45D3b553f51
  |- NexaReceiptRegistry 0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1
frontend (auditgen-core/, Vite + React + TS, strict + strictNullChecks)
```

### AI adapter

`src/aiAdapter.mjs` exposes one function, `runAudit()`.
The default adapter is `llm`, which performs a real paid upstream LLM call through `src/upstreamX402.mjs` (EIP-3009 `TransferWithAuthorization` on Base, USDC).
The GenLayer adapter is preserved behind `NEXA_AI_ADAPTER=genlayer`, but GenLayer is not operational in this environment: the configured GenLayer contract has no deployed code, so it is not used.
Set `NEXA_AI_ADAPTER=llm` (default) for the working path.

## Contracts

Both contracts are Solidity 0.8.24, built with Foundry (`forge build` clean), and deployed to BOT Chain Mainnet (chain id 677) by `0x3F5b96A494061F7338Da529e3047809Ac6a7FB84`.

| Contract | Address | Deploy transaction |
| --- | --- | --- |
| `NexaServiceRegistry` | `0x4d5845487a11491575aFE5E63554E45D3b553f51` | `0x774aa7e08d7e48d56df1507db2abea7e23098e6fdc29bfe14ed34a0aa5146c8f` |
| `NexaReceiptRegistry` | `0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1` | `0x1c270907cdf8ef0d386a55d066d44c984916ef3bbe8c7b0da028c5c862d81feb` |

Registered service on `NexaServiceRegistry`:

| Field | Value |
| --- | --- |
| service id | `resume-intelligence-v1` |
| endpoint | `POST /api/audit` (endpoint hash `0x0ef2aa3a...47cf0e606`) |
| provider / fee recipient | `0x772c86be44eAF536df1B5f8924417acCC6bB4028` |
| price | `100000` atomic USDT = `0.10 USDT` |
| registration transaction | `0x42cfcc36602001792522af58b7e902dc68b56b7df675d52706bbfd9301e1e8db` |

Settlement infrastructure used by the server (not written by this repo):

| Role | Address |
| --- | --- |
| USDT (6 decimals) | `0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C` |
| canonical Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| x402 exact-token Permit2 settlement proxy | `0x402085c248EeA27D92E8b30b2C58ed07f9E20001` |

## Verified end-to-end runs

The runs below are the earlier Bohr Testnet runs, independently verifiable at `https://scan.bohr.life/tx/<hash>`. The current BOT Chain Mainnet deployment writes receipts to `NexaReceiptRegistry` (`0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1`), viewable at `https://scan.botchain.ai/address/0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1`.

| Payment (settlement) transaction | Receipt transaction | Result |
| --- | --- | --- |
| `0x5a9ad9ac88f62793a41cf67d0f7cc32ddb8d542f402b818f710c4e2929c11c44` | `0x9720dd6ab02d350b23a28385ae2e49ade0a6cc0d81b60bcf9beeab8af0efee02` | HTTP 200, `PARTIAL_FIT` |
| `0xa37f1b9f44b7c620673d2cbb7d63b0090017fcf51bc1ed31a86b6ae11c9ddfe6` | `0xc713910294661f2d80cc7a4dd95c7d64f0f0013a9d1137d2aecce925a3094911` | HTTP 200, `PARTIAL_FIT` |
| `0x19d20a9172a2d43004453f8cb8e51b84d377125b28a359485985c3f458b9d0d8` | `0xfad52d8f9e3ca487329f5f57a0fe327c518fdba9e83a4ff0da7d62d5f5ca812e` | HTTP 200, `PARTIAL_FIT` |

Settlement transactions additionally emit the x402 proxy settlement event and a standard `tUSDT` transfer log to the configured payee.
Receipt transactions emit `PaymentReceiptRecorded(bytes32 indexed paymentId, bytes32 indexed serviceId, address indexed payer, address provider, address asset, uint256 amount, bytes32 resultHash)`.

Negative-path verification (all asserted by `npm run test:x402`):

| Case | Expected | Observed |
| --- | --- | --- |
| no payment | `402` | `402` with `PAYMENT-REQUIRED` |
| tampered amount | `402 payment_amount_mismatch` | confirmed |
| valid payment | `200` | `200` with `PAYMENT-RESPONSE` |
| immediate replay | `409 duplicate_payment` | `409` |
| replay after server restart | `402 settlement_failed` | `402` (Permit2 nonce revert `0x756688fe`) |

## Quick start

### Prerequisites

- Node.js 20+
- a funded BOT Chain Mainnet account (USDT for the audit price plus a little BOT for gas)
- optional: Foundry, for rebuilding the contracts
- optional: an injected EVM wallet in the browser, for the frontend payment flow

### 1. Install

```bash
git clone https://github.com/Saber1Y/Nexa.git
cd Nexa
npm install
cd auditgen-core && npm install && cd ..
```

### 2. Configure

```bash
cp .env.example .env
```

Required values:

| Variable | Meaning |
| --- | --- |
| `BOT_RPC_URL`, `BOT_CHAIN_ID`, `BOT_EXPLORER_URL` | defaults already point at BOT Chain Mainnet |
| `BOT_USDT_ADDRESS` | USDT token, 6 decimals |
| `BOT_PERMIT2_ADDRESS`, `BOT_EXACT_PERMIT2_PROXY` | Permit2 and the x402 settlement proxy |
| `NEXA_PAY_TO_ADDRESS` | address that receives the service fees |
| `NEXA_FACILITATOR_PRIVATE_KEY` | server-side key used only to pay settlement gas |
| `NEXA_RECEIPT_SIGNER_PRIVATE_KEY` | server-side key that writes receipts to `NexaReceiptRegistry` |
| `NEXA_AUDIT_PRICE_ATOMIC` | price in atomic USDT (`100000` = `0.10`) |
| `NEXA_SERVICE_ID` | must match a service registered in `NexaServiceRegistry` |
| `NEXA_RECEIPT_REGISTRY_ADDRESS` | `0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1` |
| `NEXA_UPSTREAM_*` | upstream paid LLM endpoint, asset and key |

Keep `.env` out of version control (it is gitignored).
Never commit private keys, seeds, or API keys.

### 3. Run the server

```bash
npm start
# Nexa BOT service ready on 3402; chain=BOT Chain Mainnet (eip155:677); payTo=0x772c...; price=100000 atomic USDT
# Nexa BOT bridge listening
```

Health check: `curl http://localhost:3402/health`

### 4. Run the real paid end-to-end demo

```bash
NEXA_AGENT_PRIVATE_KEY=0x... NEXA_BASE_URL=http://localhost:3402 npm run demo:agent
```

The demo performs the whole loop: `402` challenge, Permit2 signature, on-chain settlement, AI execution, on-chain receipt, HTTP `200`.
It prints the settlement transaction hash and the receipt transaction hash.

### 5. Run the verification suite

```bash
npm run test:bot        # chain, token, decimals, Permit2 presence
NEXA_AGENT_PRIVATE_KEY=0x... npm run test:x402   # negative + replay paths
node scripts/test-upstream.mjs   # real paid upstream LLM call
```

### 6. Frontend

```bash
cd auditgen-core
npm run dev
```

The UI pays through the same `/api/audit` protocol from the browser (see `src/hooks/useX402Bot.ts`).
Configure `VITE_API_BASE_URL` (default `http://localhost:3402`) in `auditgen-core/.env.example`.

## HTTP API

| Endpoint | Auth | Returns |
| --- | --- | --- |
| `POST /api/audit` | x402 payment (Permit2 witness) | AI audit result, `PAYMENT-RESPONSE` header, receipt transaction |
| `GET /api/services` | none | registered services, price, payee, x402 acceptances |
| `GET /api/audits` | none | recent audit ledger records (newest first, max 200, stored in `data/audits.json`) |
| `GET /api/verify/:paymentId` | none | local record plus on-chain receipt and a `hashMatches` integrity flag |
| `GET /api/receipt/:paymentId` | none | on-chain receipt read from `NexaReceiptRegistry` |
| `GET /api/stats` | none | aggregate metrics derived from the audit ledger |
| `POST /api/waitlist` | none | stores an email in `data/waitlist.json` (deduplicated) |
| `GET /health` | none | liveness |

Request input is validated (with `zod`) before any payment is accepted, so an invalid payload can never take funds.

## Project structure

```text
contracts/                  Foundry contracts (ServiceRegistry, ReceiptRegistry)
scripts/customer-agent-demo.mjs   real paid end-to-end agent run
scripts/test-x402-negative.mjs    negative + replay assertions
scripts/test-bot.mjs              chain/token/Permit2 sanity checks
scripts/test-upstream.mjs         upstream paid LLM check
src/                          Express server, x402, adapters, receipts
auditgen-core/                Vite + React frontend
api/index.mjs                 Vercel serverless entry (exports the Express app)
data/                         local audit ledger + waitlist (gitignored)
```

## Verification

Anyone can verify a result without trusting this repository:

1. Take the `paymentId` from a response (or from `GET /api/audits`).
2. Call `GET /api/receipt/:paymentId`, or read `NexaReceiptRegistry` directly on-chain.
3. Compare the on-chain `resultHash` with the hash of the returned result payload (or with the local record: `hashMatches` in `GET /api/verify/:paymentId`).
4. Open the settlement and receipt transactions in `https://scan.bohr.life/`.

## Security notes

- Input validation happens before payment acceptance.
- Payment verification checks EIP-712 typed data against the canonical Permit2 domain for chain `968`, plus token balance and allowance.
- Settlement is performed by an audited x402 settlement proxy, not by ad-hoc transfer logic.
- Replay is blocked by the in-memory payment cache at runtime and by Permit2 nonces on-chain after a restart.
- Gas keys (`NEXA_FACILITATOR_PRIVATE_KEY`) and the receipt signer key are server-side only; buyers never share keys.
- The upstream paid LLM call is only made after settlement succeeds, and a `503` from upstream does not charge the buyer.

## Known limitations

- The audit ledger and waitlist are local JSON files, not a database: they are per-instance and gitignored.
- `GET /api/audits`, `/api/verify`, `/api/receipt`, `/api/stats` are unauthenticated public reads.
- GenLayer is preserved as an adapter but is not operational here (its configured contract has no code).
- `NexaReceiptRegistry` records one receipt per `paymentId` by design; a second receipt for the same id reverts.
- Browser wallet payments were not exercised in a real browser in this environment; the same protocol was verified with the scripted agent.
- Bulk screening is disabled: the mode switcher and the Bulk Registry panel are commented out in `auditgen-core/src/pages/Audit.tsx` (the `POST /api/waitlist` endpoint still works).
- The upstream LLM endpoint can return `503 source_unavailable`; the client retries and never charges on upstream failure.

## Deploy

`vercel.json` and `api/index.mjs` keep their original shape: the Express app is exported as the serverless function and the frontend builds to `auditgen-core/dist`.
The serverless function gets `maxDuration: 60` because the flow settles on-chain before executing the AI service.
Set every variable from `.env.example` in the deployment target before deploying.
On Vercel the audit ledger and waitlist live under `/tmp`, so `/api/audits` and `/api/stats` reflect the current instance only; receipt verification through `/api/receipt` and `/api/verify` reads the chain and is unaffected.

## Legacy

The original Stellar/MPP implementation was replaced by the BOT Chain x402 runtime.
Legacy Stellar scripts and dependencies were removed in this migration; `GENLAYER_*` variables remain only for the preserved GenLayer adapter path.
