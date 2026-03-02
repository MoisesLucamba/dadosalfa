import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Production from "./pages/Production";
import Exports from "./pages/Exports";
import Predictions from "./pages/Predictions";
import Prices from "./pages/Prices";
import Risk from "./pages/Risk";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import Search from "./pages/Search";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import Competitors from "./pages/Competitors";
import Workspace from "./pages/Workspace";
import Subscription from "./pages/Subscription";
import WellSimulation from "./pages/WellSimulation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">A carregar...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/landing" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/production"
                  element={
                    <ProtectedRoute>
                      <Production />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exports"
                  element={
                    <ProtectedRoute>
                      <Exports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/predictions"
                  element={
                    <ProtectedRoute>
                      <Predictions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prices"
                  element={
                    <ProtectedRoute>
                      <Prices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risk"
                  element={
                    <ProtectedRoute>
                      <Risk />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <Alerts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <Search />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pricing"
                  element={
                    <ProtectedRoute>
                      <Pricing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/competitors"
                  element={
                    <ProtectedRoute>
                      <Competitors />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspace"
                  element={
                    <ProtectedRoute>
                      <Workspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subscription"
                  element={
                    <ProtectedRoute>
                      <Subscription />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/well-simulation"
                  element={
                    <ProtectedRoute>
                      <WellSimulation />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
