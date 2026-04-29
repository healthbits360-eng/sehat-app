import { AppShell } from "./components/layout/AppShell";
import { Switch, Route, Router as WouterRouter } from "wouter";

import Landing from "./pages/landing";
import RoleSelect from "./pages/role-select";
import PatientDashboard from "./pages/patient-dashboard";

import { AppShell } from "./components/layout/AppShell";

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
