# BOTChain Dev Program – 3 Projects Handoff

The three projects built for the BOTChain Dev Program:

1. **Nexa** – Machine-Payable AI Services (x402 on BOT Chain)
2. **Busto** – Verified Invoice Settlement (BOT Chain)
3. **Mandate** – Agent Spending Control Plane (BOT Chain)

## 1. Nexa – Machine-Payable AI Services (x402)

Agent-native, machine-payable API infrastructure. Autonomous agents pay per request via x402 v2 + Permit2 on BOT Chain Bohr Testnet (968). Every call settles before execution and records a tamper-proof result hash on-chain.

### Links
- Live: https://nexa-ai-bridge-kappa.vercel.app
- API Services: https://nexa-ai-bridge-kappa.vercel.app/api/services
- Docs: https://nexa-ai-bridge-kappa.vercel.app/docs
- GitHub: https://github.com/Saber1Y/Nexa
- MCP: https://github.com/Saber1Y/Nexa/tree/main/mcp

### Services (Machine-Payable)
| Service ID | Endpoint | Price (tUSDT) | Atomic | Purpose |
|---|---|---|---|---|
| `resume-intelligence-v1` | `POST /api/audit` | 0.10 | 100000 | Full job/candidate fit audit |
| `jd-resume-match-v1` | `POST /api/match` | 0.05 | 50000 | Semantic JD↔resume match |
| `skills-extraction-v1` | `POST /api/skills` | 0.025 | 25000 | Skill extraction (normalized/deduped) |

Batch: `POST /api/match/batch` (up to 20 resumes). Discovery: `GET /api/services`.

### Test (30s)
Wallet on BOT Chain 968 (faucet: https://faucet.botchain.ai/en/basic). Go to [/audit](https://nexa-ai-bridge-kappa.vercel.app/audit), run → copy `paymentId` → [/verify](https://nexa-ai-bridge-kappa.vercel.app/verify) shows `found: true, hashMatches: true`.

---

## 2. Busto – Verified Invoice Settlement

Busto settles verified vendor invoices on BOT Chain Testnet (968). Invoices are paid via ERC-20 transferFrom with a deterministic `invoiceRef` replay guard enforced on-chain. Full end-to-end settlement executed and verified on-chain.

### Links
- Contract source/docs: `/tmp/custos/BOT-CHAIN.md` (reference doc)
- GitHub: https://github.com/Saber1Y/Busto (if present) / see `/tmp/custos/BOT-CHAIN.md`

### Contracts (BOT Chain 968)
- BustoSettlement: `0xf08790ceffd2521538f4be5cabad059631bd2eb2`
- Token (tUSDT): `0x75edC9335175Fc0552D51D48439F229c10420fe3` (6 decimals)
- Authorized caller: Custos Edge wallet

### Verified On-Chain Settlement
- Approval: [0x31726011a1479de447dcb774954b611d281b08dac9e93af89f90a8d2f3797854](https://scan.bohr.life/tx/0x31726011a1479de447dcb774954b611d281b08dac9e93af89f90a8d2f3797854)
- Settlement: [0x2ea60336babd5e995c79b2575026635d91ab50f9d42a67fd3908dcbd3e8a4c23](https://scan.bohr.life/tx/0x2ea60336babd5e995c79b2575026635d91ab50f9d42a67fd3908dcbd3e8a4c23)
- Block 25784689, Amount 1.000000 tUSDT, Invoice INV-1042
- Replay protection verified: re-attempt reverted with `AlreadySettled(bytes32)`, counter/volume unchanged.

### Key Properties
- Single authorized caller (no agent custody)
- Pinned token, exact-amount approval, checked transfer
- On-chain replay guard (`settlementExists(invoiceRef)`), checks-effects-interactions
- Deterministic `invoiceRef` per invoice

---

## 3. Mandate – Agent Spending Control Plane

Policy-checked spend vaults for autonomous agents on BOT Chain. Each wallet deploys its own vault (via `MandateVaultFactory`); agents get scoped keys with enforceable caps/allowlists/daily limits/approvals. The contract is the only authority — agents never hold balances.

### Links
- GitHub: https://github.com/Saber1Y/Mandate (see `/Users/mac/codes/BOT-CHAIN/Mandate/README.md`)
- Architecture: `/Users/mac/codes/BOT-CHAIN/Mandate/architecture.md`
- Security: `/Users/mac/codes/BOT-CHAIN/Mandate/security.md`
- Web/MCP: `/Users/mac/codes/BOT-CHAIN/Mandate/web/mcp/`

### Network
- BOT Chain Bohr Testnet (Chain ID 968), tUSDT, RPC `https://rpc.bohr.life`, Explorer `https://scan.bohr.life`

### How It Works
1. Create vault (1 signature) — owned by your wallet, with leash (max tx, daily cap, expiry, approval threshold)
2. Fund vault with tUSDT — agent can only spend from vault, never holds balance
3. Register agent + policy + allowlists → issue scoped API key. Agent introspects leash via API and proposes spends inside policy
4. All spends require policy checks; human approval required unless policy allows

---

## Testing & Verification
- **Nexa:** End-to-end x402 flow verified live (real on-chain settlement + receipt + `hashMatches`). On-chain receipts authoritative.
- **Busto:** Real settlement executed + state/event verified on-chain; replay guard proven live.
- **Mandate:** Contracts + policy enforcement model documented; architecture/security reviewed.

All three are complete and ready for BOTChain Dev Program review.
