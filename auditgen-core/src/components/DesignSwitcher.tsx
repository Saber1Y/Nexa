import { useBrand, type Brand } from "@/hooks/use-brand";
import { cn } from "@/lib/utils";
import { Palette, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const brands: { id: Brand; name: string; color: string }[] = [
  { id: "purple", name: "Classic Purple", color: "bg-[#a855f7]" },
  { id: "blue", name: "Stellar Blue", color: "bg-[#3b82f6]" },
  { id: "green", name: "Cyber Green", color: "bg-[#10b981]" },
  { id: "cyan", name: "Electric Cyan", color: "bg-[#06b6d4]" },
];

export function DesignSwitcher() {
  const { brand, setBrand } = useBrand();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-all group">
          <Palette className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
            Design Lab
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-2 glass-card border-primary/20">
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
            Switch Identity
          </p>
        </div>
        {brands.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onClick={() => setBrand(b.id)}
            className={cn(
              "flex items-center justify-between gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors",
              brand === b.id ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", b.color)} />
              <span className="text-sm font-medium">{b.name}</span>
            </div>
            {brand === b.id && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
