import { useEffect, useRef } from "react";

const STELLAR_COLOR = "#08B5F5"; // Stellar Blue
const NEXA_COLOR = "#8B5CF6";    // Nexa Purple
const GENLAYER_COLOR = "#10B981"; // GenLayer Emerald
const PACKET_COLOR = "#FFFFFF";

const BridgeAnimation = () => {
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

    // Hub Definitions
    const getHubs = (cw: number, ch: number) => {
      const centerY = ch / 2 - 20;
      const margin = cw * 0.15;
      return {
        stellar: { x: margin, y: centerY, color: STELLAR_COLOR, label: "STELLAR" },
        nexa: { x: cw / 2, y: centerY, color: NEXA_COLOR, label: "NEXA BRIDGE" },
        genlayer: { x: cw - margin, y: centerY, color: GENLAYER_COLOR, label: "GENLAYER" },
      };
    };

    interface Hub {
      x: number;
      y: number;
      color: string;
      label: string;
    }

    interface Packet {
      from: Hub;
      to: Hub;
      type: string;
      progress: number;
      speed: number;
      offset: number;
    }

    const packets: Packet[] = [];
    const createPacket = (from: Hub, to: Hub, type: string) => {
      packets.push({
        from,
        to,
        type,
        progress: 0,
        speed: 0.005 + Math.random() * 0.005,
        offset: (Math.random() - 0.5) * 20,
      });
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      if (cw === 0 || ch === 0) return;

      ctx.clearRect(0, 0, cw, ch);
      time += 0.01;

      const hubs = getHubs(cw, ch);

      // Periodically spawn packets to show the loop
      if (Math.floor(time * 60) % 180 === 0) {
        createPacket(hubs.stellar, hubs.nexa, "payment");
      }
      if (Math.floor(time * 60) % 180 === 60) {
        createPacket(hubs.nexa, hubs.genlayer, "request");
      }
      if (Math.floor(time * 60) % 180 === 120) {
        createPacket(hubs.genlayer, hubs.stellar, "result");
      }

      // 1. Draw "Bridge" Connections (The Lines)
      ctx.setLineDash([5, 10]);
      ctx.lineDashOffset = -time * 20;
      ctx.lineWidth = 1;

      // Stellar -> Nexa
      ctx.beginPath();
      ctx.moveTo(hubs.stellar.x, hubs.stellar.y);
      ctx.bezierCurveTo(
        (hubs.stellar.x + hubs.nexa.x) / 2, hubs.stellar.y - 40,
        (hubs.stellar.x + hubs.nexa.x) / 2, hubs.stellar.y - 40,
        hubs.nexa.x, hubs.nexa.y
      );
      ctx.strokeStyle = `rgba(139, 92, 246, 0.2)`;
      ctx.stroke();

      // Nexa -> GenLayer
      ctx.beginPath();
      ctx.moveTo(hubs.nexa.x, hubs.nexa.y);
      ctx.bezierCurveTo(
        (hubs.nexa.x + hubs.genlayer.x) / 2, hubs.nexa.y - 40,
        (hubs.nexa.x + hubs.genlayer.x) / 2, hubs.nexa.y - 40,
        hubs.genlayer.x, hubs.genlayer.y
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw Agent Packets (Traveling dots)
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          packets.splice(i, 1);
          continue;
        }

        const t = p.progress;
        const cx1 = (p.from.x + p.to.x) / 2;
        const cy1 = p.from.y - 40 + p.offset;
        
        // Quadratic Bezier point
        const px = (1 - t) * (1 - t) * p.from.x + 2 * (1 - t) * t * cx1 + t * t * p.to.x;
        const py = (1 - t) * (1 - t) * p.from.y + 2 * (1 - t) * t * cy1 + t * t * p.to.y;

        // Packet Glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grd.addColorStop(0, "white");
        grd.addColorStop(0.5, p.from.color);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();

        // Packet Core
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw Hubs
      Object.values(hubs).forEach((hub) => {
        const pulse = Math.sin(time * 2 + (hub.label === "NEXA BRIDGE" ? 1 : 0)) * 0.5 + 0.5;
        const size = hub.label === "NEXA BRIDGE" ? 28 : 22;

        // Outer Ring
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, size + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `${hub.color}44`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glow
        const grd = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, size * 2.5);
        grd.addColorStop(0, `${hub.color}33`);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Hub Core (Stylized Logos)
        ctx.save();
        ctx.translate(hub.x, hub.y);
        ctx.rotate(time * 0.2);

        if (hub.label === "STELLAR") {
          // Rocket/Orbit Shape
          ctx.strokeStyle = hub.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-15, 0);
          ctx.lineTo(15, 0);
          ctx.stroke();
        } else if (hub.label === "NEXA BRIDGE") {
          // Shield Hexagon
          ctx.strokeStyle = hub.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for(let j=0; j<6; j++) {
            const angle = j * Math.PI / 3;
            const x = Math.cos(angle) * 14;
            const y = Math.sin(angle) * 14;
            if(j===0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          // Inner node
          ctx.fillStyle = hub.color;
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // GenLayer Nodes
          ctx.strokeStyle = hub.color;
          ctx.lineWidth = 2;
          for(let k=0; k<5; k++) {
            const angle = k * Math.PI * 2 / 5 + time;
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 12;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Label
        ctx.font = "bold 10px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = hub.color;
        ctx.textAlign = "center";
        ctx.fillText(hub.label, hub.x, hub.y + size + 22);
        
        ctx.font = "8px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        const subText = hub.label === "STELLAR" ? "PAYMENT/PROOF" : hub.label === "NEXA BRIDGE" ? "ORCHESTRATOR" : "AI CONSENSUS";
        ctx.fillText(subText, hub.x, hub.y + size + 34);
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
    <div className="relative w-full h-full min-h-[250px] sm:min-h-[350px] md:min-h-[420px] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  );
};

export default BridgeAnimation;
