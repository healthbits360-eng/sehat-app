import { Switch, Route, Router as WouterRouter } from "wouter";
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
        <ProtectedRoute>
          <PatientOnboarding />
        </ProtectedRoute>
      </Route>

      {/* Patient Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppShell><PatientDashboard /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/plan">
        <ProtectedRoute>
          <AppShell><PatientPlan /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/tracking">
        <ProtectedRoute>
          <AppShell><PatientTracking /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/chat">
        <ProtectedRoute>
          <AppShell><PatientChat /></AppShell>
        </ProtectedRoute>
      </Route>

      <Route path="/learn">
        <ProtectedRoute>
          <AppShell><Learn /></AppShell>
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute>
          <AppShell><AdminDashboard /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/patients">
        <ProtectedRoute>
          <AppShell><AdminPatients /></AppShell>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/patients/:patientId">
        <ProtectedRoute>
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
    <WouterRouter>
      <Router />
    </WouterRouter>
  );
}

export default App;
