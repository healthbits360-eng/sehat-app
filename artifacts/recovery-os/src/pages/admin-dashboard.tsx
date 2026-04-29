export default function AdminDashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Dashboard 🧑‍⚕️</h1>
      <p>Welcome to admin panel</p>

      <div style={{ marginTop: 30 }}>
        <div style={{ marginBottom: 10 }}>
          👥 Total Patients: 25
        </div>

        <div style={{ marginBottom: 10 }}>
          📈 Active Patients (7 days): 12
        </div>

        <div style={{ marginBottom: 10 }}>
          💊 Avg Pain Score: 4 / 10
        </div>

        <div style={{ marginBottom: 10 }}>
          ✅ Avg Adherence: 78%
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3>Recent Check-ins</h3>

        <div style={{ marginTop: 10 }}>
          <div>• Rahul — Back Pain — 6/10</div>
          <div>• Aisha — Knee Rehab — 3/10</div>
          <div>• John — Shoulder Injury — 5/10</div>
        </div>
      </div>
    </div>
  );
}
