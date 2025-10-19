import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { initNDK, setupAuth } from "@/lib/ndk";
import Index from "./pages/Index";
import GoalDetail from "./pages/GoalDetail";
import MyGoals from "./pages/MyGoals";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Header } from "@/components/Header";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const init = async () => {
      try {
        await initNDK();
        await setupAuth();
      } catch (error) {
        console.error('Failed to initialize NDK:', error);
      }
    };
    init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/goal/:id" element={<GoalDetail />} />
              <Route path="/me" element={<MyGoals />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
