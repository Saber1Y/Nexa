# BOTChain Dev Program – 3 Projects Handoff

This document covers all three projects built for the BOTChain Dev Program.

## 1. Nexa – Machine-Payable AI Services (x402 on BOT Chain)

Nexa is agent-native machine-payable API infrastructure. Agents pay per request on-chain via x402 v2 + Permit2 on BOT Chain Bohr Testnet (968). Every call settles before execution and records a tamper-proof result hash on-chain.

### Links
- Live: https://nexa-ai-bridge-kappa.vercel.app
- API: https://nexa-ai-bridge-kappa.vercel.app/api/services
- Docs: https://nexa-ai-bridge-kappa.vercel.app/docs
- GitHub: https://github.com/Saber1Y/Nexa
- MCP: https://github.com/Saber1Y/Nexa/tree/main/mcp
- Contracts (968): ServiceRegistry 0x6A2C234080Da1329b0418E4d5Dc34b2004D464bF, ReceiptRegistry 0xC37C0a8988BB174f2a9b199b8B8f0Fb51f5c848D, tUSDT 0x75edC9335175Fc0552D51D48439F229c10420fe3

### Services
- resume-intelligence-v1 (0.10 tUSDT / POST /api/audit)
- jd-resume-match-v1 (0.05 tUSDT / POST /api/match)
- skills-extraction-v1 (0.025 tUSDT / POST /api/skills)
- POST /api/match/batch (up to 20 resumes)

### Quick Test
Wallet on BOT 968 (faucet https://faucet.botchain.ai/en/basic), go to /audit, run → copy paymentId → /verify shows found:true, hashMatches:true.

---

## 2. RouteDock – Unified Payment Execution for Autonomous Agents (Stellar)

RouteDock unifies x402, MPP Charge, and MPP Session into one SDK. One call (`client.pay()`) auto-selects the right mode from provider manifest (`routedock.json`). Contracts on Stellar Soroban with safe session handling.

### Links
- GitHub: https://github.com/winsznx/routedock
- npm: https://www.npmjs.com/package/@routedock/routedock
- Docs: https://github.com/winsznx/routedock#readme

### Key Points
- One SDK, auto mode selection (x402 / mpp-charge / mpp-session)
- Soroban contracts (ModeRouter, X402Client, MPPClient, OneWayChannel wrapper)
- Local facilitator for x402 testnet; OZ facilitator integration for mainnet
- Audit-safe session primitives

### Quick Start
```ts
import { RouteDockClient } from '@routedock/routedock'
const client = new RouteDockClient({ wallet, network: 'testnet' })
const result = await client.pay('https://provider.example.com/price')
```

---

## 3. OmniCFO – Autonomous Treasury Management (Hackathon + Production Build)

Autonomous CFO agent that audits invoices, enforces fail-closed policy gates, and triggers compliant fiat settlements via Dodo Payments. Built in AO (Agent Orchestrator) dev environment.

### Links
- GitHub: https://github.com/Saber1Y/OmniCFO
- Live Demo: https://omnicfo.vercel.app
- Dashboard: https://omnicfo.vercel.app/dashboard
- Backend: https://omnicfo-production.up.railway.app
- README: https://github.com/Saber1Y/OmniCFO#readme

### Features
- Invoice ingestion + AI audit (risk classification, compliance checks)
- Policy engine with fail-closed gates (block on violations)
- Telegram bot notifications + approvals
- Dodo Payments integration for fiat settlements
- Corporate dashboard (Overview/Invoices/Policy/Activity/Settings)

### Stack
Next.js 15 + TypeScript (frontend), Express + Supabase (backend), Telegram Bot API, Dodo Payments API.

---

## Testing Notes
- Nexa: test on BOT Chain 968 with real x402 flow (end-to-end). On-chain receipts are authoritative.
- RouteDock: test against Stellar testnet (x402/MPP) with example agents.
- OmniCFO: UI + API live; test invoice flow and policy gates.

All three projects are complete, deployed where applicable, and ready for BOTChain Dev Program review.
