const ScoreRing = ({ score }: { score: number }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 70 ? "var(--neon-green)" : score >= 40 ? "var(--neon-cyan)" : "var(--neon-red)";

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
        {/* Score ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-display font-black" style={{ color, textShadow: `0 0 10px ${color}60` }}>
          {score}
        </span>
        <span className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground font-label">/100</span>
      </div>
    </div>
  );
};

export default ScoreRing;
