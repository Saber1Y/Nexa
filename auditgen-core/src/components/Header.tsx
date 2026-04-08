import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BrainCircuit } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">GenHire AI</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-wider uppercase">Decentralized Resume Screening</p>
          </div>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
};

export default Header;
