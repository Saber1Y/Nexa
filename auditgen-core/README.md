# AuditGen: Decentralized AI Resume Auditing  
### *Powered by GenLayer & Multi-LLM Consensus*

[**AuditGen**](https://auditgen-ai-liart.vercel.app/) is a next-generation hiring infrastructure that eliminates bias and restores trust in recruitment through the **GenLayer** Intelligent Contract network. 


<img width="1453" height="924" alt="03 04 2026_21 05 24_REC" src="https://github.com/user-attachments/assets/38b96108-7d89-4d62-a994-33c658e091de" />


By leveraging decentralized AI consensus, AuditGen doesn't just "scan" resumes; multiple independent AI validators reach a **verifiable on-chain agreement** on a candidate's fit for any world-class role.

---

## Key Features

- **Decentralized Consensus**: Uses the **Equivalence Principle** where five independent AI validators (Llama-3, GPT-4, Claude-3) must agree on the final verdict.
- **Polyglot Intelligence**: Natively supports auditing in over **50 languages**. Submit a Spanish resume for an English job description—AuditGen handles the logic automatically.
- **Dual-Input Strategy**: Support for both direct **PDF Parsing** (via `pdfjs-dist`) and manual text-area input for perfect user flexibility.
- **On-Chain Audit Trails**: Every screening corresponds to a unique transaction ID. Results are immutable and verifiably stored on the **GenLayer StudioNet**.
- **Mode-Aware UX**: Context-aware interfaces for both **Candidates** (Evaluate my fit) and **Employers** (Audit a candidate).

---

## The Tech Stack

- **Blockchain**: [GenLayer](https://genlayer.com) (StudioNet - Chain ID 61999)
- **Intelligent Contract**: Python-based **GenVM** contract (`GenHire.py`)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Animations**: Framer Motion (for premium, high-impact interactions)
- **Web3 Integration**: Wagmi v3 + Viem + RainbowKit + `genlayer-js`

---

## How it Works

1. **Submission**: The user inputs a Job Title, Description, and the Candidate's Resume.
2. **Consensus Trigger**: A transaction is broadcast to the GenLayer network.
3. **Multi-Model Audit**: Five independent LLM validators analyze the data, evaluating:
   - **Score** (0-100% Fit)
   - **Verdict** (Qualified, Maybe, Not Qualified)
   - **Seniority Estimate** (Junior, Mid, Senior)
   - **Skill Gap Analysis** (Matched vs. Missing Skills)
4. **On-Chain Settlement**: Once a majority agreement is reached, the final result is permanently recorded and fetched by the UI.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MetaMask (configured for GenLayer StudioNet)
- [GenLayer CLI](https://docs.genlayer.com)

### 1. Installation
```bash
git clone https://github.com/mrnetwork0001/auditgen.git
cd auditgen/frontend
npm install --legacy-peer-deps
```

### 2. Environment Setup
Create a `.env` in the `frontend` directory:
```dotenv
VITE_GENLAYER_RPC_URL="https://studio.genlayer.com/api"
VITE_CONTRACT_ADDRESS="0x9CE0d2626753e4C7729C70feeB41eAaB8Ecc189b"
VITE_GENLAYER_CHAIN_ID=61999
```

### 3. Run Locally
```bash
npm run dev
```

---

## Future Roadmap

- **The Consensus Council Customizer**: Allowing employers to hand-select their AI validator models.
- **AI-Generated Hard Skill Quizzes**: On-chain verification of the skills reported on the CV.
- **Audit-to-Hire Escrow**: Salary/Bonus payouts secured by smart contract escrow upon a successful audit.
- **Soulbound 'Expert' Badges**: Miniting non-transferable NFTs to candidates who score >95% in their field.

---

## Hackathon Context

Developed for the **GenLayer Bradbury Hackathon**. 

AuditGen demonstrates that **Decentralized AI** is the only way to solve the transparency crisis in global hiring. By moving the "Judgment" of talent from a private black-box server to a public, multi-validator protocol, we enable a truly meritocratic future for work.

**Contact:** [MrNetwork](https://x.com/encrypt_wizard) 
