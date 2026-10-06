const services = new Map();

export function registerBuiltInService() {
  services.set("resume-intelligence-v1", {
    id: "resume-intelligence-v1",
    name: "Resume Intelligence",
    description: "AI-powered candidate analysis using the existing Nexa audit pipeline.",
    endpoint: "/api/audit",
    priceAtomic: "100000",
    asset: process.env.BOT_USDT_ADDRESS || "0x75edC9335175Fc0552D51D48439F229c10420fe3",
    network: "eip155:968",
    active: true,
    version: "1",
  });
  services.set("jd-resume-match-v1", {
    id: "jd-resume-match-v1",
    name: "JD ↔ Resume Match",
    description: "Semantic match of a job description against a resume with weighted skills, ATS fit and ranked gaps.",
    endpoint: "/api/match",
    priceAtomic: "50000",
    asset: process.env.BOT_USDT_ADDRESS || "0x75edC9335175Fc0552D51D48439F229c10420fe3",
    network: "eip155:968",
    active: true,
    version: "1",
  });
  services.set("skills-extraction-v1", {
    id: "skills-extraction-v1",
    name: "Skills Extraction",
    description: "Extracts hard/soft skills, tools, frameworks, years, certifications and deduplicates into a clean normalized list.",
    endpoint: "/api/skills",
    priceAtomic: "25000",
    asset: process.env.BOT_USDT_ADDRESS || "0x75edC9335175Fc0552D51D48439F229c10420fe3",
    network: "eip155:968",
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
