import { useLocation } from "wouter";

export default function RoleSelect() {
  const [, navigate] = useLocation();

  const selectRole = (role: string) => {
    localStorage.setItem("role", role);

    if (role === "patient") {
      navigate("/select-condition");
    } else {
      navigate("/admin-dashboard");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Select Your Role</h1>

      <button onClick={() => selectRole("patient")} style={{ marginRight: 10 }}>
        I am Patient
      </button>

      <button onClick={() => selectRole("admin")}>
        I am Physiotherapist
      </button>
    </div>
  );
}
