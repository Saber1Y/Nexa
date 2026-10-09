const techs = [
  "BOT Chain", "USDT", "x402 Protocol", "Payment Proof", "EIP-712", "GenLayer",
  "AI Consensus", "SHA-256", "Receipt Registry", "Result Hash",
  "Exact Payments", "402 Challenge", "BOT Scan", "Smart Contract"
];

const LanguageMarquee = () => (
  <section className="relative py-8 overflow-hidden border-y" style={{ borderColor: "rgba(0,255,136,0.08)" }}>
    <div className="flex animate-marquee whitespace-nowrap">
      {[...techs, ...techs].map((t, i) => (
        <span
          key={i}
          className="mx-6 text-[10px] font-display font-bold uppercase tracking-[0.2em]"
          style={{ color: i % 3 === 0 ? "var(--neon-green)" : i % 3 === 1 ? "var(--neon-cyan)" : "var(--neon-magenta)", opacity: 0.35 }}
        >
          {t}
        </span>
      ))}
    </div>
  </section>
);

export default LanguageMarquee;
