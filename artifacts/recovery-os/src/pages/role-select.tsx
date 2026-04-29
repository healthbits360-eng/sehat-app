import { useLocation } from "wouter";

export default function RoleSelect() {
  const [, navigate] = useLocation();

  return (
    <div style={{ padding: 40 }}>
      <h1>Choose Your Role</h1>
      <p>Select how you want to continue</p>

      {/* Patient Button */}
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          display: "block",
          marginTop: 20,
          padding: "12px 24px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        👤 I am Patient
      </button>

      {/* Admin Button */}
      <button
        onClick={() => navigate("/admin-dashboard")}
        style={{
          display: "block",
          marginTop: 10,
          padding: "12px 24px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        🧑‍⚕️ I am Admin
      </button>
    </div>
  );
}
