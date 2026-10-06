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
}

export function listServices() {
  return [...services.values()].filter((service) => service.active);
}

export function getService(id) {
  return services.get(id);
}
