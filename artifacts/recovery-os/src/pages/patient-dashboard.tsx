import { exercises } from "../lib/exercises";

export default function PatientDashboard() {
  const patientCondition = "knee"; // later dynamic

  const filteredExercises = exercises.filter(
    (ex) => ex.condition === patientCondition
  );

  return (
    <div style={{ padding: 40 }}>
      <h1>Patient Dashboard</h1>

      <h3>Your Condition: {patientCondition}</h3>

      <h2 style={{ marginTop: 30 }}>Recommended Exercises</h2>

      {filteredExercises.map((ex) => (
        <div key={ex.id} style={{ marginTop: 20 }}>
          <h4>{ex.name}</h4>

          <iframe
            width="300"
            height="200"
            src={ex.video}
            title={ex.name}
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      ))}
    </div>
  );
}
