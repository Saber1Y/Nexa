#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const NEXA_BASE = process.env.NEXA_BASE_URL || "https://nexa-ai-bridge-kappa.vercel.app";

const server = new Server({ name: "nexa-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "jd_resume_match",
      description: "Semantic JD↔resume match (0.05 tUSDT). Returns match_score, overlaps, gaps, verdict, summary.",
      inputSchema: {
        type: "object",
        required: ["jobDescription", "resumeText"],
        properties: {
          jobDescription: { type: "string" },
          resumeText: { type: "string" }
        }
      }
    },
    {
      name: "skills_extraction",
      description: "Extract skills from text/resume (0.025 tUSDT). Returns hard_skills, soft_skills, tools, frameworks, certifications, years, raw_count.",
      inputSchema: {
        type: "object",
        required: [],
        properties: {
          resumeText: { type: "string" },
          text: { type: "string" }
        }
      }
    },
    {
      name: "resume_intelligence",
      description: "Full resume/job audit (0.10 tUSDT). Returns verdict, match_score, seniority, matched/missing skills, explanation, confidence.",
      inputSchema: {
        type: "object",
        required: ["jobTitle", "resumeText"],
        properties: {
          jobTitle: { type: "string" },
          jobDescription: { type: "string" },
          mustHaveSkills: { type: "string" },
          resumeText: { type: "string" }
        }
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const args = req.params.arguments || {};
  // Note: x402 payment handled client-side by x402-aware MCP clients; this is a reference server
  return {
    content: [{ type: "text", text: `Nexa MCP tool ${name} ready. Call via x402-enabled client to ${NEXA_BASE}. Args: ${JSON.stringify(args)}` }]
  };
});

const transport = new StdioServerTransport();
server.connect(transport);
