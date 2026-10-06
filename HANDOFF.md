# Nexa – Handoff Document

## Project Summary
Nexa is agent-native, machine-payable AI infrastructure. Using x402 v2 + Uniswap Permit2, autonomous agents pay per request on-chain (BOT Chain Testnet 968), settlement happens before execution, and every result is anchored with an on-chain receipt hash (tamper-proof verification).

## Deliverables
- 3 production-ready x402 services (real on-chain payments + receipts)
- Batch endpoint for bulk processing
- MCP server for agent consumption (Claude/Cursor)
- Working web UI + docs + verification flows
- Standalone GitHub repo + live Vercel deployment

## Services (Machine-Payable)

| Service ID | Endpoint | Price (tUSDT) | Atomic | Purpose |
|---|---|---|---|---|
| `resume-intelligence-v1` | `POST /api/audit` | 0.10 | 100000 | Full job/candidate fit audit (verdict, score, gaps, explanation) |
| `jd-resume-match-v1` | `POST /api/match` | 0.05 | 50000 | Semantic JD↔resume match (score, overlaps, gaps, verdict, summary) |
| `skills-extraction-v1` | `POST /api/skills` | 0.025 | 25000 | Extract hard/soft skills, tools, frameworks, certs, years (normalized/deduped) |

**Batch:** `POST /api/match/batch` (up to 20 resumes) — body `{jobDescription, resumes:[{resumeText},...]}`, priced 0.05 tUSDT/request.

Discovery: [GET /api/services](https://nexa-ai-bridge-kappa.vercel.app/api/services)

## Links

- **Live App:** [https://nexa-ai-bridge-kappa.vercel.app](https://nexa-ai-bridge-kappa.vercel.app)
- **Docs:** [https://nexa-ai-bridge-kappa.vercel.app/docs](https://nexa-ai-bridge-kappa.vercel.app/docs)
- **GitHub:** [https://github.com/Saber1Y/Nexa](https://github.com/Saber1Y/Nexa)
- **MCP:** [mcp/server.ts](https://github.com/Saber1Y/Nexa/tree/main/mcp)
- **Explorer (BOT Bohr):** [https://scan.bohr.life](https://scan.bohr.life)
- **Faucet (tBOT/tUSDT):** [https://faucet.botchain.ai/en/basic](https://faucet.botchain.ai/en/basic)

## Contracts (BOT Chain Testnet 968)

- ServiceRegistry: `0x6A2C234080Da1329b0418E4d5Dc34b2004D464bF`
- ReceiptRegistry: `0xC37C0a8988BB174f2a9b199b8B8f0Fb51f5c848D`
- tUSDT: `0x75edC9335175Fc0552D51D48439F229c10420fe3` (6 decimals)
- x402 Permit2 Proxy: `0x402085c248EeA27D92E8b30b2C58ed07f9E20001`
- Permit2: `0x000000000022D473030F116dDEE9F6B43aC78BA3`
- payTo: `0x772c86be44eAF536df1B5f8924417acCC6bB4028`

## Quick Test (2 min)

**Setup:** MetaMask/Rabby on Chain ID 968, RPC `https://rpc.bohr.life`, get tBOT+tUSDT from [faucet](https://faucet.botchain.ai/en/basic). Need >= 0.10 tUSDT.

**UI Flow:**
1. [nexa-ai-bridge-kappa.vercel.app](https://nexa-ai-bridge-kappa.vercel.app/) → Connect Wallet (auto-switches to 968)
2. [/audit](https://nexa-ai-bridge-kappa.vercel.app/audit) → fill Job Title + Resume (paste/PDF)
3. Run → approve 1 Permit2 EIP-712 signature → wait ~15–30s
4. Copy `paymentId` → [/verify](https://nexa-ai-bridge-kappa.vercel.app/verify) → verify `found: true, hashMatches: true`

**Verification:** On-chain receipts are authoritative (permanent). Explorer links show real settlement + receipt transactions.

## Notes
- No mocks in payment/receipt path. End-to-end verified on testnet + live deployment.
- MCP + batch added for agent-first consumption (best path to real usage/mainnet adoption).
- Ready for team QA → greenlight for mainnet deployment.
