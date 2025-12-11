"use client";

export default function Dashboard() {
  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div style={{ paddingTop: "90px" }}>
      <h1>Dashboard</h1>

      <button
        onClick={() => (window.location.href = "/add_admin")}
        style={{ marginRight: 10 }}
      >
        Add Admin
      </button>

      <button onClick={logout} style={{ background: "red", color: "white" }}>
        Logout
      </button>
    </div>
  );
}
