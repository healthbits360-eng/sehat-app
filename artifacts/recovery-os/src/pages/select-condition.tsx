import { useLocation } from "wouter";

export default function SelectCondition() {
  const [, navigate] = useLocation();

  const selectCondition = (condition: string) => {
    localStorage.setItem("condition", condition);
    navigate("/dashboard");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Select Your Condition</h1>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => selectCondition("knee")}>Knee Pain</button>
        <br /><br />
        <button onClick={() => selectCondition("back")}>Back Pain</button>
        <br /><br />
        <button onClick={() => selectCondition("shoulder")}>Shoulder Pain</button>
      </div>
    </div>
  );
}
