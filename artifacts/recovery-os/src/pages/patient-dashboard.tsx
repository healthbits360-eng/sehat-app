import { exercises } from "../lib/exercises";
import { useState } from "react";

export default function PatientDashboard() {
  const patientCondition = localStorage.getItem("condition") || "knee";

  const [completed, setCompleted] = useState<number[]>([]);

  const filteredExercises = exercises.filter(
    (ex) => ex.condition === patientCondition
  );

  const markDone = (id: number) => {
    setCompleted((prev) => [...prev, id]);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Patient Dashboard</h1>

      <h3>Your Condition: {patientCondition}</h3>

      <h2 style={{ marginTop: 30 }}>Rehab Plan</h2>

      {filteredExercises.map((ex) => (
        <div
          key={ex.id}
          style={{
            marginTop: 20,
            padding: 15,
            border: "1px solid #ccc",
            borderRadius: 10
          }}
        >
          <h3>{ex.name}</h3>

          {/* ✅ REPLACED iframe WITH image */}
          <img
            src={ex.video}
            alt={ex.name}
            style={{
              width: "300px",
              height: "200px",
              objectFit: "cover",
              borderRadius: 10
            }}
          />

          <p><b>Reps:</b> {ex.reps}</p>
          <p><b>Sets:</b> {ex.sets}</p>
          <p><b>Duration:</b> {ex.duration}</p>
          <p><b>Instructions:</b> {ex.instructions}</p>

          {completed.includes(ex.id) ? (
            <p style={{ color: "green" }}>✅ Completed</p>
          ) : (
            <button onClick={() => markDone(ex.id)}>
              Mark as Done
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
