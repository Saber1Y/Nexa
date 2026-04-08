import { useEffect, useRef } from "react";

const VALIDATOR_COUNT = 5;
const LASER_COLOR = "#8B5CF6";
const VERIFIED_COLOR = "#22C55E";

const HeroAuditAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let time = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener("resize", resize);

    // Resume card dimensions (relative to canvas CSS size)
    const getCardRect = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.min(260, rect.width * 0.55);
      const h = w * 1.4;
      const x = (rect.width - w) / 2;
      const y = (rect.height - h) / 2;
      return { x, y, w, h };
    };

    // Fake resume lines
    const resumeLines = [
      { y: 0.08, w: 0.5, h: 8, type: "name" },
      { y: 0.15, w: 0.35, h: 6, type: "sub" },
      { y: 0.22, w: 0.7, h: 4, type: "line" },
      { y: 0.27, w: 0.6, h: 4, type: "line" },
      { y: 0.32, w: 0.65, h: 4, type: "line" },
      { y: 0.40, w: 0.4, h: 6, type: "section" },
      { y: 0.46, w: 0.75, h: 4, type: "line" },
      { y: 0.51, w: 0.55, h: 4, type: "line" },
      { y: 0.56, w: 0.68, h: 4, type: "line" },
      { y: 0.61, w: 0.5, h: 4, type: "line" },
      { y: 0.69, w: 0.4, h: 6, type: "section" },
      { y: 0.75, w: 0.72, h: 4, type: "line" },
      { y: 0.80, w: 0.6, h: 4, type: "line" },
      { y: 0.85, w: 0.45, h: 4, type: "line" },
      { y: 0.90, w: 0.58, h: 4, type: "line" },
    ];

    // Validator node positions (around the card)
    const getValidators = (card: { x: number; y: number; w: number; h: number }, cw: number, ch: number) => {
      const cx = card.x + card.w / 2;
      const cy = card.y + card.h / 2;
      const rx = Math.min(card.w * 0.9, cw * 0.4);
      const ry = Math.min(card.h * 0.7, ch * 0.4);
      return Array.from({ length: VALIDATOR_COUNT }, (_, i) => {
        const angle = (i / VALIDATOR_COUNT) * Math.PI * 2 - Math.PI / 2;
        return {
          x: cx + Math.cos(angle) * rx,
          y: cy + Math.sin(angle) * ry,
        };
      });
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      ctx.clearRect(0, 0, cw, ch);
      time += 0.008;

      const card = getCardRect();
      const validators = getValidators(card, cw, ch);

      // Laser Y position (oscillates up and down the card)
      const laserProgress = (Math.sin(time * 1.2) + 1) / 2; // 0-1
      const laserY = card.y + card.h * 0.05 + laserProgress * card.h * 0.9;

      // Draw pulsating connection lines from validators to card
      validators.forEach((v, i) => {
        const pulse = Math.sin(time * 3 + i * 1.3) * 0.5 + 0.5;
        const nearestX = Math.max(card.x, Math.min(card.x + card.w, v.x));
        const nearestY = Math.max(card.y, Math.min(card.y + card.h, v.y));

        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(nearestX, nearestY);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 + pulse * 0.25})`;
        ctx.lineWidth = 1 + pulse * 0.5;
        ctx.stroke();

        // Traveling dot along line
        const dotT = (time * 0.5 + i * 0.2) % 1;
        const dx = nearestX + (v.x - nearestX) * dotT;
        const dy = nearestY + (v.y - nearestY) * dotT;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${0.5 + pulse * 0.5})`;
        ctx.fill();
      });

      // Card shadow & 3D perspective
      ctx.save();
      const tiltX = Math.sin(time * 0.7) * 2;
      const tiltY = Math.cos(time * 0.5) * 1.5;
      ctx.translate(card.x + card.w / 2, card.y + card.h / 2);
      ctx.translate(-card.w / 2, -card.h / 2);

      // Card shadow
      ctx.shadowColor = "rgba(139, 92, 246, 0.15)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = tiltX;
      ctx.shadowOffsetY = 10 + tiltY;

      // Card background
      ctx.fillStyle = "rgba(15, 15, 25, 0.85)";
      ctx.beginPath();
      const r = 12;
      ctx.roundRect(0, 0, card.w, card.h, r);
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Card border
      ctx.strokeStyle = "rgba(139, 92, 246, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Resume content lines
      const localLaserY = laserY - card.y;
      resumeLines.forEach((line) => {
        const ly = line.y * card.h;
        const lw = line.w * (card.w - 40);
        const lx = 20;
        const dist = Math.abs(ly - localLaserY);
        const proximity = Math.max(0, 1 - dist / 40);

        let color: string;
        if (line.type === "name") {
          color = proximity > 0.3
            ? `rgba(34, 197, 94, ${0.6 + proximity * 0.4})`
            : "rgba(255, 255, 255, 0.35)";
        } else if (line.type === "section") {
          color = proximity > 0.3
            ? `rgba(34, 197, 94, ${0.5 + proximity * 0.5})`
            : "rgba(255, 255, 255, 0.25)";
        } else if (line.type === "sub") {
          color = proximity > 0.3
            ? `rgba(34, 197, 94, ${0.4 + proximity * 0.6})`
            : "rgba(255, 255, 255, 0.2)";
        } else {
          color = proximity > 0.3
            ? `rgba(34, 197, 94, ${0.3 + proximity * 0.7})`
            : "rgba(255, 255, 255, 0.13)";
        }

        // Green glow when laser passes
        if (proximity > 0.5) {
          ctx.shadowColor = `rgba(34, 197, 94, ${proximity * 0.5})`;
          ctx.shadowBlur = 12;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(lx, ly, lw, line.h, 3);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      });

      // Laser line
      const laserLocalY = localLaserY;
      const grad = ctx.createLinearGradient(0, 0, card.w, 0);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.1, `${LASER_COLOR}cc`);
      grad.addColorStop(0.5, `${LASER_COLOR}`);
      grad.addColorStop(0.9, `${LASER_COLOR}cc`);
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      ctx.fillRect(0, laserLocalY - 1, card.w, 2);

      // Laser glow
      const glowGrad = ctx.createLinearGradient(0, laserLocalY - 15, 0, laserLocalY + 15);
      glowGrad.addColorStop(0, "transparent");
      glowGrad.addColorStop(0.5, `rgba(139, 92, 246, 0.15)`);
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, laserLocalY - 15, card.w, 30);

      ctx.restore();

      // Validator nodes (glowing dots)
      validators.forEach((v, i) => {
        const pulse = Math.sin(time * 2.5 + i * 1.5) * 0.5 + 0.5;
        const size = 4 + pulse * 2;

        // Outer glow
        const grd = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, size * 4);
        grd.addColorStop(0, `rgba(139, 92, 246, ${0.3 + pulse * 0.3})`);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(v.x, v.y, size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(v.x, v.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${0.7 + pulse * 0.3})`;
        ctx.fill();

        // Inner bright
        ctx.beginPath();
        ctx.arc(v.x, v.y, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.4})`;
        ctx.fill();

        // Label
        ctx.font = "9px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = `rgba(139, 92, 246, ${0.5 + pulse * 0.3})`;
        ctx.textAlign = "center";
        ctx.fillText(`V${i + 1}`, v.x, v.y + size + 14);
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  );
};

export default HeroAuditAnimation;
