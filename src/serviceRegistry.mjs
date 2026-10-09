import {BOT_NETWORK, BOT_USDT_ADDRESS} from "./botConfig.mjs";

const services = new Map();

export function registerBuiltInService() {
  services.set("resume-intelligence-v1", {
    id: "resume-intelligence-v1",
    name: "Resume Intelligence",
    description: "AI-powered candidate analysis using the existing Nexa audit pipeline.",
    endpoint: "/api/audit",
    priceAtomic: "100000",
    asset: BOT_USDT_ADDRESS,
    network: BOT_NETWORK,
    active: true,
    version: "1",
  });
  services.set("jd-resume-match-v1", {
    id: "jd-resume-match-v1",
    name: "JD ↔ Resume Match",
    description: "Semantic match of a job description against a resume with weighted skills, ATS fit and ranked gaps.",
    endpoint: "/api/match",
    priceAtomic: "50000",
    asset: BOT_USDT_ADDRESS,
    network: BOT_NETWORK,
    active: true,
    version: "1",
  });
  services.set("skills-extraction-v1", {
    id: "skills-extraction-v1",
    name: "Skills Extraction",
    description: "Extracts hard/soft skills, tools, frameworks, years, certifications and deduplicates into a clean normalized list.",
    endpoint: "/api/skills",
    priceAtomic: "25000",
    asset: BOT_USDT_ADDRESS,
    network: BOT_NETWORK,
    active: true,
    version: "1",
  });
}

export function listServices() {
  return [...services.values()].filter((service) => service.active);
}

export function getService(id) {
  return services.get(id);
}

export default {registerBuiltInService, listServices, getService};
