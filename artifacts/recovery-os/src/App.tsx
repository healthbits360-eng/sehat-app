import { Switch, Route, Router as WouterRouter } from "wouter";

import { AppShell } from "./components/layout/AppShell";

import Landing from "./pages/landing";
import RoleSelect from "./pages/role-select";
import PatientDashboard from "./pages/patient-dashboard";
import AdminDashboard from "./pages/admin-dashboard"; // 👈 NEW

function Router() {
  return (
    <Switch>

      <Route path="/">
        <AppShell>
          <Landing />
        </AppShell>
      </Route>

      <Route path="/role-select">
        <AppShell>
          <RoleSelect />
        </AppShell>
      </Route>

      <Route path="/dashboard">
        <AppShell>
          <PatientDashboard />
        </AppShell>
      </Route>

      {/* 👇 NEW ADMIN ROUTE */}
      <Route path="/admin-dashboard">
        <AppShell>
          <AdminDashboard />
        </AppShell>
      </Route>

    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter>
      <Router />
    </WouterRouter>
  );
}
