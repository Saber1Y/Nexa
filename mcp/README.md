# Nexa MCP Server

MCP server exposing Nexa's machine-payable x402 services to AI agents (Claude, Cursor, etc.)

Tools:
- jd_resume_match (0.05 tUSDT) -> POST /api/match
- skills_extraction (0.025 tUSDT) -> POST /api/skills
- resume_intelligence (0.10 tUSDT) -> POST /api/audit

Note: Payment (x402 + Permit2) is handled by the MCP client. This server is a thin wrapper; production agents call endpoints directly with x402.
