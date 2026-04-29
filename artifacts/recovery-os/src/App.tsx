import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";

import Landing from "./pages/landing";
import RoleSelect from "./pages/role-select";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

import PatientOnboarding from "./pages/patient-onboarding";
import PatientDashboard from "./pages/patient-dashboard";
import PatientPlan from "./pages/patient-plan";
import PatientTracking from "./pages/patient-tracking";
import PatientChat from "./pages/patient-chat";
import Learn from "./pages/learn";
import Settings from "./pages/settings";

import AdminDashboard from "./pages/admin-dashboard";
import AdminPatients from "./pages/admin-patients";
import AdminPatientDetail from "./pages/admin-patient-detail";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      <Route path="/role-select">
        <ProtectedRoute>
          <RoleSelect />
        </ProtectedRoute>
      </Route>

      <Route path="/onboarding">
        <ProtectedRoute allowedRole="patient">
          <PatientOnboarding />
        </ProtectedRoute>
      </Route>

      {/* Patient Routes */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRole="patient">
          <AppShell><PatientDashboard /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/plan">
        <ProtectedRoute allowedRole="patient">
          <AppShell><PatientPlan /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/tracking">
        <ProtectedRoute allowedRole="patient">
          <AppShell><PatientTracking /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/chat">
        <ProtectedRoute allowedRole="patient">
          <AppShell><PatientChat /></AppShell>
        </ProtectedRoute>
      </Route>

      <Route path="/learn">
        <ProtectedRoute allowedRole="patient">
          <AppShell><Learn /></AppShell>
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute allowedRole="admin">
          <AppShell><AdminDashboard /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/patients">
        <ProtectedRoute allowedRole="admin">
          <AppShell><AdminPatients /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/patients/:patientId">
        <ProtectedRoute allowedRole="admin">
          <AppShell><AdminPatientDetail /></AppShell>
        </ProtectedRoute>
      </Route>

      {/* Shared Routes */}
      <Route path="/settings">
        <ProtectedRoute>
          <AppShell><Settings /></AppShell>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default App;
