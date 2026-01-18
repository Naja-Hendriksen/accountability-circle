import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import GroupView from "./pages/GroupView";
import Apply from "./pages/Apply";
import ApplicationSubmitted from "./pages/ApplicationSubmitted";
import Privacy from "./pages/Privacy";
import Guidelines from "./pages/Guidelines";
import AdminApplications from "./pages/AdminApplications";
import AdminGroups from "./pages/AdminGroups";
import EmailTemplates from "./pages/EmailTemplates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/group" element={<GroupView />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/application-submitted" element={<ApplicationSubmitted />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/guidelines" element={<Guidelines />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/groups" element={<AdminGroups />} />
            <Route path="/admin/email-templates" element={<EmailTemplates />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
