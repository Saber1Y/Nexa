# Nexa - User-Paid AI Services on BOT Chain

Nexa provides resume audits paid directly by the user's wallet in USDT on BOT Chain.
The browser calls `NexaGateway.pay`, then the API verifies the transaction, runs the AI audit, and records a result receipt on-chain.

The active service is `resume-intelligence-v1` at `0.10 USDT` per audit.
The audit payment and receipt path uses BOT Chain Mainnet, chain ID `677`.
AI inference uses Google Gemini through the native Gemini API; it does not use x402 or make a second blockchain payment.

Live deployment: https://nexa-ai-bridge-kappa.vercel.app
The Vercel project is connected to `https://github.com/Saber1Y/Nexa`, so every push to `main` deploys the app.

### Mainnet contracts

- Chain ID: `677`
- NexaGateway: `0x2f085838eef6255d527db447e188545da47683b9`
- NexaServiceRegistry: `0x4d5845487a11491575aFE5E63554E45D3b553f51`
- NexaReceiptRegistry: `0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1`
- Mainnet service registration: `0xcdf22254ffe6dadb719413d7081f2262ba54083f0ac25ff845bfd2539b50b098`
- Latest verified receipt record: `0x7b2df0f7458c7ffc90baf805540204da4dc73f0588f89e1c7da623747570ff1b`
- Built on [BOT Chain](https://botchain.ai)
- Follow [@Nexa05 on X](https://x.com/Nexa05)

## Payment protocol

1. The browser hashes the audit request and asks the wallet to approve USDT for the NexaGateway.
2. The wallet calls `NexaGateway.pay(serviceId, requestHash)` on BOT Chain Mainnet.
3. The gateway checks the active service registration, transfers `0.10 USDT` to the configured treasury, and emits `ServicePaid` with the payer and request hash.
4. The browser submits the audit request and payment transaction hash to `POST /api/audit`.
5. The API verifies the gateway call and event, including payer, service ID, amount, request hash, and on-chain paid status, before running Gemini.
6. The result hash is recorded in `NexaReceiptRegistry`; the response includes the payment and receipt transaction details.

The gateway's per-payer nonce creates unique payment IDs, while the API prevents duplicate and in-flight processing.
All token amounts are integer atomic units; mainnet USDT uses 6 decimals.

## Architecture

```text
 browser wallet (auditgen-core/src/hooks/useGatewayPay.ts)
   -> NexaGateway.pay                 user-signed USDT payment on BOT Chain
   -> POST /api/audit                 payment transaction + audit request
 Express server (src/server.mjs)
   |- src/gatewayVerifier.mjs       validates the user-sent gateway transaction
   |- src/aiAdapter.mjs              runs the Gemini audit
   |- src/llmApi.mjs                 native Gemini API request with x-goog-api-key
   |- src/receipts.mjs               writes and reads on-chain receipts
BOT Chain Mainnet (chain id 677, RPC https://rpc.botchain.ai)
   |- USDT 0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C (6 decimals)
   |- NexaGateway 0x2f085838eef6255d527db447e188545da47683b9
   |- NexaServiceRegistry 0x4d5845487a11491575aFE5E63554E45D3b553f51
   |- NexaReceiptRegistry 0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1
frontend (auditgen-core/, Vite + React + TS, strict + strictNullChecks)
```

### AI adapter

`src/aiAdapter.mjs` exposes one function, `runAudit()`.
The active adapter calls Gemini 3.8 Flash through the native Gemini API using `NEXA_LLM_API_KEY`.
This provider key is separate from BOT Chain payment settlement.
The preserved GenLayer adapter is selected with `NEXA_AI_ADAPTER=genlayer` when a valid deployment is configured.

## Contracts

The service registry, gateway, and receipt registry are deployed to BOT Chain Mainnet (chain ID 677).

| Contract | Address | Deploy transaction |
| --- | --- | --- |
| `NexaGateway` | `0x2f085838eef6255d527db447e188545da47683b9` | `0x4e23e1a85af97b30c9f9207ba245c05d2b69b165ea662ea8313af4033ee6ba5f` |
| `NexaServiceRegistry` | `0x4d5845487a11491575aFE5E63554E45D3b553f51` | `0x774aa7e08d7e48d56df1507db2abea7e23098e6fdc29bfe14ed34a0aa5146c8f` |
| `NexaReceiptRegistry` | `0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1` | `0x1c270907cdf8ef0d386a55d066d44c984916ef3bbe8c7b0da028c5c862d81feb` |

Registered service on `NexaServiceRegistry`:

| Field | Value |
| --- | --- |
| service id | `resume-intelligence-v1` |
| endpoint | `POST /api/audit` (endpoint hash `0x0ef2aa3a95936ebc172d870eb1d7f61400c7024b08cd3ed47a5f34ed7cf0e606`) |
| provider / fee recipient | `0x772c86be44eAF536df1B5f8924417acCC6bB4028` |
| price | `100000` atomic USDT = `0.10 USDT` |
| registration transaction | `0xcdf22254ffe6dadb719413d7081f2262ba54083f0ac25ff845bfd2539b50b098` |

## Verified end-to-end runs

The end-to-end audit below was run on Bohr Testnet and is independently verifiable at `https://scan.bohr.life/tx/<hash>`.
Mainnet contract deployment and service registration are verified on-chain; no mainnet customer audit is claimed here.

| Payment (settlement) transaction | Receipt transaction | Result |
| --- | --- | --- |
| `0x021e1090de4d21e54bdc32824ecf2da689e48c0d9bb80ae71cc056c707a73a40` | `0x641bd95ac62f7b38600a67f7777dc06487d535f3f95ea8d451ec7bfb6700c5dc` | HTTP 200, `STRONG_FIT` |

Gateway payments emit `ServicePaid(bytes32 indexed paymentId, bytes32 indexed serviceId, address indexed payer, uint256 amount, bytes32 requestHash)`.
Receipt transactions emit `PaymentReceiptRecorded(bytes32 indexed paymentId, bytes32 indexed serviceId, address indexed payer, address provider, address asset, uint256 amount, bytes32 resultHash)`.

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
cp auditgen-core/.env.example auditgen-core/.env.mainnet.local
```

Required values:

| Variable | Meaning |
| --- | --- |
| `BOT_RPC_URL`, `BOT_CHAIN_ID`, `BOT_EXPLORER_URL` | defaults already point at BOT Chain Mainnet |
| `BOT_USDT_ADDRESS` | USDT token, 6 decimals |
| `NEXA_GATEWAY_ADDRESS` | deployed NexaGateway address |
| `NEXA_PAY_TO_ADDRESS` | address that receives the service fees |
| `NEXA_RECEIPT_SIGNER_PRIVATE_KEY` | server-side key that writes receipts to `NexaReceiptRegistry` |
| `NEXA_AUDIT_PRICE_ATOMIC` | price in atomic USDT (`100000` = `0.10`) |
| `NEXA_SERVICE_ID` | must match a service registered in `NexaServiceRegistry` |
| `NEXA_SERVICE_REGISTRY_ADDRESS` | `0x4d5845487a11491575aFE5E63554E45D3b553f51` |
| `NEXA_RECEIPT_REGISTRY_ADDRESS` | `0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1` |
| `NEXA_RECEIPT_REGISTRY_START_BLOCK` | mainnet registry event scan start block (`25875770`) |
| `NEXA_LLM_API_KEY` | Gemini API key from Google AI Studio |

Keep `.env` out of version control (it is gitignored).
Never commit private keys, seeds, or API keys.

### 3. Run the server

```bash
npm start
# Nexa BOT service ready on 3403; chain=BOT Chain Mainnet (eip155:677); payTo=0x772c...; price=100000 atomic USDT
# Nexa BOT bridge listening
```

Health check: `curl http://localhost:3403/health`

### 4. Run the verification suite

```bash
forge test
cd auditgen-core
npm run build:mainnet
```

### 5. Frontend

```bash
cd auditgen-core
npm run dev:mainnet -- --host 0.0.0.0 --port 8081
```

The UI reads mainnet settings from `.env.mainnet.local` and sends user-signed gateway payments to the local API on port `3403`.
Use `npm run dev:testnet` to load `.env.testnet.local` instead.

## HTTP API

| Endpoint | Auth | Returns |
| --- | --- | --- |
| `POST /api/audit` | verified `NexaGateway.pay` transaction | AI audit result, payment details, receipt transaction |
| `GET /api/services` | none | active direct-gateway service and price |
| `GET /api/audits` | none | recent audit ledger records (newest first, max 200, stored in `data/audits.json`) |
| `GET /api/verify/:paymentId` | none | local record plus on-chain receipt and a `hashMatches` integrity flag |
| `GET /api/receipt/:paymentId` | none | on-chain receipt read from `NexaReceiptRegistry` |
| `GET /api/stats` | none | aggregate metrics derived from the audit ledger |
| `POST /api/waitlist` | none | stores an email in `data/waitlist.json` (deduplicated) |
| `GET /health` | none | liveness |

The API verifies the submitted gateway transaction and request hash before running the audit.

## Project structure

```text
contracts/                  Foundry contracts (Gateway, ServiceRegistry, ReceiptRegistry)
scripts/test-gateway-e2e.mjs      direct-gateway testnet end-to-end run
src/                          Express server, gateway verifier, Gemini adapter, receipts
auditgen-core/                Vite + React frontend
api/index.mjs                 Vercel serverless entry (exports the Express app)
data/                         local audit ledger + waitlist (gitignored)
```

## Verification

Anyone can verify a result without trusting this repository:

1. Take the `paymentId` from a response (or from `GET /api/audits`).
2. Call `GET /api/receipt/:paymentId`, or read `NexaReceiptRegistry` directly on-chain.
3. Compare the on-chain `resultHash` with the hash of the returned result payload (or with the local record: `hashMatches` in `GET /api/verify/:paymentId`).
4. Open the payment and receipt transactions in the explorer for the configured BOT Chain network.

## Security notes

- Input validation happens before payment acceptance.
- Payment verification checks the `NexaGateway.pay` call and matching `ServicePaid` event against the expected payer, request hash, service, and price.
- The user's wallet signs and broadcasts the BOT Chain payment directly.
- The receipt signer key is server-side only; buyers never share keys.
- Gemini inference runs only after payment verification; model/API errors do not require the user to pay again when retrying the same transaction and request.

## Known limitations

- The audit ledger and waitlist are local JSON files, not a database: they are per-instance and gitignored.
- `GET /api/audits`, `/api/verify`, `/api/receipt`, `/api/stats` are unauthenticated public reads.
- GenLayer is preserved as an optional adapter.
- `NexaReceiptRegistry` records one receipt per `paymentId` by design; a second receipt for the same id reverts.
- Mainnet contract state and service registration are verified on-chain; the recorded full audit run in this repository is on Bohr Testnet.
- Bulk screening is disabled: the mode switcher and the Bulk Registry panel are commented out in `auditgen-core/src/pages/Audit.tsx` (the `POST /api/waitlist` endpoint still works).
- Gemini API availability, quota, and billing depend on the configured Google AI Studio project.

## Deploy

`vercel.json` and `api/index.mjs` export the Express app as a serverless function, and the frontend builds to `auditgen-core/dist`.
Configure the mainnet RPC, USDT, gateway, registries, receipt signer, and Gemini API key in the deployment environment before deploying.
Check the Vercel deployment status after pushing before testing the hosted application.
On Vercel the audit ledger and waitlist live under `/tmp`, so `/api/audits` and `/api/stats` reflect the current instance only; receipt verification reads the chain.

## Legacy

Legacy x402 files and tests remain in the repository but are not used by the active audit payment path.
`GENLAYER_*` variables remain for the optional GenLayer adapter.
