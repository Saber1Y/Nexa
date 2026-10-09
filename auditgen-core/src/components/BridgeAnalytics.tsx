import { useState, useEffect } from "react";
import { BarChart3, Zap, TrendingUp, Clock, DollarSign } from "lucide-react";
import { apiEndpoint } from "@/utils/apiBase";

interface Stats {
  totalAudits: number;
  avgScore: number;
  avgTime: number;
  successRate: number;
  totalPaidTusdt: string;
  receiptCount: number;
  latestAudit: string | null;
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const step = Math.max(1, Math.floor(value / 20));
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, value);
      setDisplay(current);
      if (current >= value) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

const BridgeAnalytics = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(apiEndpoint("/api/stats"));
        setStats(await res.json());
      } catch { /* silent */ }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats || stats.totalAudits === 0) return null;

  const cards = [
    { label: "Total Audits", value: stats.totalAudits, suffix: "", icon: <BarChart3 className="w-5 h-5" />, neon: "var(--neon-green)" },
    { label: "Success Rate", value: stats.successRate, suffix: "%", icon: <TrendingUp className="w-5 h-5" />, neon: "var(--neon-green)" },
    { label: "Avg Score", value: stats.avgScore, suffix: "/100", icon: <Zap className="w-5 h-5" />, neon: "var(--neon-cyan)" },
    { label: "Avg Consensus", value: stats.avgTime, suffix: "s", icon: <Clock className="w-5 h-5" />, neon: "var(--neon-cyan)" },
    { label: "Paid Volume", value: Number(stats.totalPaidTusdt), suffix: " USDT", icon: <DollarSign className="w-5 h-5" />, neon: "var(--neon-magenta)", extra: `${stats.receiptCount} on-chain receipts` },
  ];

  return (
    <section className="w-full">
      <div className="text-center mb-6">
        <h3 className="text-sm md:text-base font-display font-bold text-foreground uppercase tracking-wider">
          Bridge Analytics
        </h3>
        <p className="font-label text-[9px] uppercase tracking-[0.2em] mt-1" style={{ color: "var(--neon-green)", opacity: 0.6 }}>
          &gt; live production metrics
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="cyber-card p-4 text-center group"
          >
            <div className="mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: card.neon }}>
              {card.icon}
            </div>
            <p className="font-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
              {card.label}
            </p>
            <p className="text-xl font-display font-bold" style={{ color: card.neon, textShadow: `0 0 8px ${card.neon}40` }}>
              <AnimatedNumber value={card.value} suffix={card.suffix} />
            </p>
            {card.extra && <p className="text-[9px] text-muted-foreground mt-1 tracking-wide">{card.extra}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default BridgeAnalytics;
