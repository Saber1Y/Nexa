import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Brand = "purple" | "blue" | "green" | "cyan";

interface BrandContextType {
  brand: Brand;
  setBrand: (brand: Brand) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<Brand>(() => {
    const stored = localStorage.getItem("brand-theme") as Brand;
    return ["purple", "blue", "green", "cyan"].includes(stored) ? stored : "purple";
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all possible brand classes
    root.classList.remove("brand-purple", "brand-blue", "brand-green", "brand-cyan");
    
    // Add the current brand class (except for default purple which is base)
    if (brand !== "purple") {
      root.classList.add(`brand-${brand}`);
    }
    
    localStorage.setItem("brand-theme", brand);
  }, [brand]);

  return (
    <BrandContext.Provider value={{ brand, setBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
