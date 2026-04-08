import { useNavigate } from "react-router-dom";
import BridgeAnimation from "@/components/BridgeAnimation";
import {
  BrainCircuit,
  ShieldCheck,
  Scale,
  Upload,
  Search,
  Network,
  Award,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Zap,
  Cpu,
  Globe,
  Lock,
  Rocket,
  Fuel
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import LanguageMarquee from "@/components/LanguageMarquee";
import RoadmapBento from "@/components/RoadmapBento";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Mesh background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px]" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
            {/* Left Column – Text & CTA */}
            <div className="md:pl-8 lg:pl-16 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
                <Zap className="w-3 h-3" /> Agents on Stellar Hackathon
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 font-serif">
                <span className="gradient-text glow-text">Autonomous AI</span>
                <br />
                <span className="text-foreground">Bridge</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed mx-auto md:mx-0">
                AI Agents need reliable, third-party validation to trust their own processes. Nexa provides the decentralized <span className="text-foreground font-semibold">Reasoning Layer</span> for the <span className="text-foreground font-semibold">Stellar</span> economy — powered by <span className="text-foreground font-semibold">GenLayer</span> consensus.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/audit")}
                  className="gradient-primary text-primary-foreground font-semibold px-10 py-6 text-lg hover:opacity-90 transition-all glow-border group w-full sm:w-auto"
                >
                  Launch Bridge
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>

              </div>
            </div>

            {/* Right Column – Bridge Animation */}
            <div className="h-[400px] md:h-[520px]">
              <BridgeAnimation />
            </div>
          </div>
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      </section>

      {/* Language Marquee */}
      <LanguageMarquee />

      {/* Why Nexa Section */}
      <section className="relative py-24 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Why Nexa?
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground font-serif">
              Built for <span className="gradient-text">Agentic Economies</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Cpu,
                title: "Stellar Asset Rails",
                description:
                  "Native USDC & XLM micropayments via Soroban SAC. Fee-sponsored USDC transfers mean agents pay zero gas.",
                accent: "primary",
              },
              {
                icon: ShieldCheck,
                title: "Triple-Verified Proof",
                description:
                  "Every audit anchors a SHA-256 digest on Stellar, a consensus artifact on GenLayer, and a USDC receipt.",
                accent: "accent",
              },
              {
                icon: Globe,
                title: "Chain Abstraction",
                description:
                  "Hold USDC on Stellar. Get AI results from GenLayer. Nexa abstracts the multi-chain complexity for your agents.",
                accent: "success",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-8 group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - MPP Flow */}
      <section className="relative py-24 border-t border-border/30 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Protocol Handshake
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground font-serif">
              The <span className="gradient-text">MPP 402</span> Flow
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Nexa uses the Machine Payments Protocol to allow AI agents to negotiate and sign payments autonomously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: ShieldCheck,
                title: "Challenge",
                description: "Bridge issues 402 challenge with HMAC-bound ID.",
              },
              {
                step: "02",
                icon: CreditCard,
                title: "Settle",
                description:
                  "Agent signs 1 USDC Soroban transfer on Stellar.",
              },
              {
                step: "03",
                icon: BrainCircuit,
                title: "Audit",
                description:
                  "5 GenLayer AI nodes reach consensus on the resume.",
              },
              {
                step: "04",
                icon: Award,
                title: "Anchor",
                description:
                  "SHA-256 proof is anchored back on Stellar Memo.",
              },
            ].map((step, i) => (
              <div key={step.step} className="relative group">
                <div className="glass-card p-6 h-full hover:border-primary/30 transition-all duration-300 bg-background/50">
                  <span className="text-3xl font-extrabold text-primary/20 font-mono block mb-3">
                    {step.step}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {i < 3 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-5 h-5 text-border -translate-y-1/2 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Production Ready Section */}
      <section className="relative py-24 border-t border-border/30 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Built for Mainnet
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground font-serif">
              Production <span className="gradient-text">Ready</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Nexa is designed for real-world deployment - not just a hackathon demo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Trust Selection",
                description:
                  "Agent reputation scoring via onchain attestation history. Each audit creates a verifiable SHA-256 proof, building a trust graph over time.",
              },
              {
                icon: Scale,
                title: "Built-in Arbitration",
                description:
                  "GenLayer's Equivalence Principle provides consensus across 5 independent AI validators. Disputes are resolved by the protocol, not by a single oracle.",
              },
              {
                icon: Rocket,
                title: "Stellar-Scale Throughput",
                description:
                  "5-second finality and sub-cent fees enable high-volume audit registries. The bridge is stateless - scale horizontally without bottlenecks.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-8 group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-xs font-bold text-green-600 dark:text-green-400">
              <Fuel className="w-3.5 h-3.5" /> Fee-Sponsored USDC (Zero Gas)
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-xs font-bold text-primary">
              <ShieldCheck className="w-3.5 h-3.5" /> OpenZeppelin Compatible
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-xs font-bold text-accent">
              <Globe className="w-3.5 h-3.5" /> Mainnet Ready Architecture
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6 font-serif">
            Ready to <span className="gradient-text">bridge</span>?
          </h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Experience the future of autonomous value transfer between leading blockchains.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/audit")}
            className="gradient-primary text-primary-foreground font-semibold px-12 py-8 text-xl hover:opacity-90 transition-all glow-border group"
          >
            Launch Bridge
            <ArrowRight className="w-6 h-6 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-3">
            Nexa Bridge · Built for Agents on Stellar
          </div>
          <div className="text-muted-foreground">
            Created by{" "}
            <a
              href="https://x.com/encrypt_wizard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-bold"
            >
              MrNetwork
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://stellar.org" target="_blank" className="hover:text-foreground transition-colors">Stellar</a>
            <a href="https://genlayer.com" target="_blank" className="hover:text-foreground transition-colors">GenLayer</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Dummy icons for mapping (already imported BrainCircuit etc above)
const CreditCard = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

export default Landing;
