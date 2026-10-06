import { useEffect, useRef } from "react";

/**
 * CyberBridgeAnimation — A terminal-style matrix rain + bridge schematic
 * Replaces the old SVG animation with a cyberpunk canvas.
 */
const CyberBridgeAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const chars = "NEXABRIDGE01BOTCHAINTUSDTX402PERMIT2AUDITRECEIPT⬡◆▣░▒▓".split("");
    const fontSize = 14;
    let columns: number;
    let drops: number[];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      columns = Math.floor(canvas.offsetWidth / fontSize);
      drops = Array(columns).fill(1).map(() => Math.random() * -50);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.fillStyle = "rgba(10, 10, 15, 0.06)";
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Head character — bright neon
        const brightness = Math.random();
        if (brightness > 0.85) {
          ctx.fillStyle = "#00ff88";
          ctx.shadowColor = "#00ff88";
          ctx.shadowBlur = 8;
        } else if (brightness > 0.7) {
          ctx.fillStyle = "#00d4ff";
          ctx.shadowColor = "#00d4ff";
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = `rgba(0, 255, 136, ${0.15 + brightness * 0.3})`;
          ctx.shadowBlur = 0;
        }

        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.offsetHeight / window.devicePixelRatio && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.4 + Math.random() * 0.3;
      }

      // Draw bridge schematic overlay (static)
      const cx = canvas.offsetWidth / (2 * window.devicePixelRatio);
      const cy = canvas.offsetHeight / (2 * window.devicePixelRatio);
      ctx.save();
      ctx.strokeStyle = "rgba(0, 255, 136, 0.08)";
      ctx.lineWidth = 1;

      // Hexagonal bridge shape
      const size = Math.min(cx, cy) * 0.6;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI / 3) * j - Math.PI / 6;
        const px = cx + size * Math.cos(angle);
        const py = cy + size * Math.sin(angle);
        j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner hexagon
      const innerSize = size * 0.5;
      ctx.strokeStyle = "rgba(0, 212, 255, 0.06)";
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI / 3) * j;
        const px = cx + innerSize * Math.cos(angle);
        const py = cy + innerSize * Math.sin(angle);
        j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="font-display text-xs md:text-sm tracking-[0.3em] uppercase" style={{ color: "var(--neon-green)", textShadow: "0 0 10px rgba(0,255,136,0.5)" }}>
            ⬡ NEXA BRIDGE ⬡
          </p>
          <p className="font-label text-[9px] md:text-[10px] tracking-[0.2em] uppercase mt-1" style={{ color: "var(--neon-cyan)", opacity: 0.6 }}>
            STELLAR → GENLAYER
          </p>
        </div>
      </div>
    </div>
  );
};

export default CyberBridgeAnimation;
