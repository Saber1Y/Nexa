import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { WalletProvider } from "@/hooks/useWallet";
import Landing from "./pages/Landing";
import Audit from "./pages/Audit";
import Docs from "./pages/Docs";
import History from "./pages/History";
import Verify from "./pages/Verify";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <WalletProvider>
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/history" element={<History />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
    </WalletProvider>
  </ThemeProvider>
);

export default App;
