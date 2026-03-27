import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import { useAuth } from "./contexts/AuthContext";
import PhoneShell from "./components/PhoneShell";
import AdminPanel from "./pages/AdminPanel";
import GlobalNotifications from "./components/GlobalNotifications";
import InstallPrompt from "./components/InstallPrompt";

function AppWithSession() {
  const { session } = useAuth();
  const keyLimit = session?.keyData?.limit ?? 500;

  return (
    <AppProvider keyLimit={keyLimit}>
      <GlobalNotifications />
      <InstallPrompt />
      <Switch>
        <Route path="/" component={PhoneShell} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppWithSession />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
