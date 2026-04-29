import { Switch, Route, Router as WouterRouter } from "wouter";

import Landing from "./pages/landing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
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
