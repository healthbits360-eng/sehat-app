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
      <Route path="/dashboard">
        <div style={{ padding: 40, fontSize: 24 }}>
          Dashboard DIRECT ✅
        </div>
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
