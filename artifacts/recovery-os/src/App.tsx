import { Switch, Route, Router as WouterRouter } from "wouter";

import Landing from "./pages/landing";
import RoleSelect from "./pages/role-select";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/role-select" component={RoleSelect} />
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
