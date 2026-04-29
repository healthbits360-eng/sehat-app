import { useLocation } from "wouter";

export default function RoleSelect() {
  const [, navigate] = useLocation();

  return (
    <div style={{ padding: 40 }}>
      <h1>Select Your Role</h1>

      <div style={{ marginTop: 30 }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ padding: 10, marginRight: 10 }}
        >
          I am Patient
        </button>

        <button
          onClick={() => navigate("/admin-dashboard")}
          style={{ padding: 10 }}
        >
          I am Physiotherapist
        </button>
      </div>
    </div>
  );
}
