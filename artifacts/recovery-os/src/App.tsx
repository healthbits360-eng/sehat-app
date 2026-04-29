import { Switch, Route, Router as WouterRouter } from "wouter";

import Landing from "./pages/landing";
import RoleSelect from "./pages/role-select";
import PatientDashboard from "./pages/patient-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/role-select" component={RoleSelect} />

      {/* ADD THIS */}
      import { AppShell } from "./components/layout/AppShell";  // add this at top

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
