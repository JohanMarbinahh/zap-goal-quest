import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { initNDK, setupAuth } from "@/lib/ndk";
import { useAppSelector } from "@/stores/hooks";
import Index from "./pages/Index";
import GoalDetail from "./pages/GoalDetail";
import MyGoals from "./pages/MyGoals";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Header } from "@/components/Header";

const queryClient = new QueryClient();

const App = () => {
  const isAuthenticated = useAppSelector((state) => !!state.auth.pubkey);
  const privateKey = useAppSelector((state) => state.auth.privateKey);

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
  }, [privateKey]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            {isAuthenticated && <Header />}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={isAuthenticated ? <Index /> : <Login />} />
              <Route path="/goal/:id" element={isAuthenticated ? <GoalDetail /> : <Login />} />
              <Route path="/me" element={isAuthenticated ? <MyGoals /> : <Login />} />
              <Route path="/settings" element={isAuthenticated ? <Settings /> : <Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
