import { useState, useEffect } from "react";
import { BarChart3, Zap, TrendingUp, Clock, DollarSign } from "lucide-react";

interface Stats {
  totalAudits: number;
  avgScore: number;
  avgTime: number;
  successRate: number;
  totalUsdc: number;
  totalXlm: number;
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
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${apiUrl}/api/stats`);
        setStats(await res.json());
      } catch { /* silent */ }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats || stats.totalAudits === 0) return null;

  const cards = [
    {
      label: "Total Audits",
      value: stats.totalAudits,
      suffix: "",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-primary",
      glow: "from-purple-500/20 to-blue-500/20",
    },
    {
      label: "Success Rate",
      value: stats.successRate,
      suffix: "%",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-emerald-400",
      glow: "from-emerald-500/20 to-teal-500/20",
    },
    {
      label: "Avg Score",
      value: stats.avgScore,
      suffix: "/100",
      icon: <Zap className="w-5 h-5" />,
      color: "text-amber-400",
      glow: "from-amber-500/20 to-orange-500/20",
    },
    {
      label: "Avg Consensus",
      value: stats.avgTime,
      suffix: "s",
      icon: <Clock className="w-5 h-5" />,
      color: "text-blue-400",
      glow: "from-blue-500/20 to-cyan-500/20",
    },
    {
      label: "Volume",
      value: stats.totalUsdc + stats.totalXlm,
      suffix: ` txns`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-pink-400",
      glow: "from-pink-500/20 to-rose-500/20",
      extra: `${stats.totalUsdc} USDC · ${stats.totalXlm} XLM`,
    },
  ];

  return (
    <section className="w-full">
      <div className="text-center mb-6">
        <h3 className="text-lg md:text-xl font-bold text-foreground font-serif">Bridge Analytics</h3>
        <p className="text-xs text-muted-foreground mt-1">Live production metrics from the Nexa Bridge</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`glass-card p-4 text-center relative overflow-hidden group hover:border-primary/30 transition-all`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.glow} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
              <div className={`${card.color} mx-auto mb-2 opacity-60`}>{card.icon}</div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{card.label}</p>
              <p className={`text-2xl font-bold font-mono ${card.color}`}>
                <AnimatedNumber value={card.value} suffix={card.suffix} />
              </p>
              {card.extra && <p className="text-[10px] text-muted-foreground mt-1">{card.extra}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BridgeAnalytics;
