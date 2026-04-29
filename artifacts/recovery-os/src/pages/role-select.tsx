import { useLocation } from "wouter";

export default function RoleSelect() {
  const [, navigate] = useLocation(); // 👈 STEP 3 (navigation function)

  return (
    <div style={{ padding: 40 }}>
      <h1>Role Select Page ✅</h1>
      <p>This page is working.</p>

      {/* 👇 STEP 4 (button added) */}
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}
