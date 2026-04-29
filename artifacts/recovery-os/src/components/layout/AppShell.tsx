export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, fontWeight: "bold" }}>
        AppShell Layout ✅
      </div>

      {children}
    </div>
  );
}
