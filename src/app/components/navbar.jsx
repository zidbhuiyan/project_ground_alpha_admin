"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <>
      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          background: #0e1a14;
          padding: 14px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.15);
          z-index: 1000;
          animation: slideDown 0.5s ease forwards;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .brand {
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffe27a;
          letter-spacing: 1px;
        }

        .links {
          display: flex;
          gap: 32px;
        }

        .link {
          color: white;
          font-size: 1.05rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: 0.25s ease;
        }

        .link:hover {
          color: #ffe27a;
        }

        .menu-btn {
          display: none;
          color: white;
          cursor: pointer;
          font-size: 1.8rem;
        }

        .mobile-menu {
          display: none;
          flex-direction: column;
          background: #0e1a14;
          padding: 20px;
          border-top: 1px solid rgba(255,255,255,0.15);
        }

        .mobile-link {
          padding: 12px 0;
          font-size: 1.1rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .mobile-link:hover {
          color: #ffe27a;
        }

        .logout {
          color: #ff4d4d;
          font-weight: bold;
        }

        @media (max-width: 820px) {
          .links { display: none; }
          .menu-btn { display: block; }
          .mobile-menu {
            display: ${open ? "flex" : "none"};
          }
        }
      `}</style>

      <nav className="navbar">
        <div className="brand">GROUND ALPHA</div>

        {/* DESKTOP LINKS */}
        <div className="links">
          <span className="link" onClick={() => router.push("/dashboard")}>
            🏠 Dashboard
          </span>

          <span className="link" onClick={() => router.push("/view-schedule")}>
            📅 View Schedule
          </span>

          <span
            className="link"
            onClick={() => router.push("/schedule-management")}
          >
            ⚙️ Manage Schedule
          </span>

          <span
            className="link"
            onClick={() => router.push("/rate-management")}
          >
            💲 Rates
          </span>

          <span
            className="link"
            onClick={() => router.push("/event-management")}
          >
            🎉 Events
          </span>

          {/* ✅ NEW ADMINS LINK */}
          <span
            className="link"
            onClick={() => router.push("/admin-management")}
          >
            👤 Admins
          </span>

          <span className="link logout" onClick={logout}>
            🚪 Logout
          </span>
        </div>

        {/* MOBILE MENU BUTTON */}
        <div className="menu-btn" onClick={() => setOpen(!open)}>
          {open ? "✖" : "☰"}
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className="mobile-menu">
        <span className="mobile-link" onClick={() => router.push("/dashboard")}>
          🏠 Dashboard
        </span>

        <span
          className="mobile-link"
          onClick={() => router.push("/view-schedule")}
        >
          📅 View Schedule
        </span>

        <span
          className="mobile-link"
          onClick={() => router.push("/schedule-management")}
        >
          ⚙️ Manage Schedule
        </span>

        <span
          className="mobile-link"
          onClick={() => router.push("/rate-management")}
        >
          💲 Rates
        </span>

        <span
          className="mobile-link"
          onClick={() => router.push("/event-management")}
        >
          🎉 Events
        </span>

        {/* ✅ NEW MOBILE ADMINS */}
        <span
          className="mobile-link"
          onClick={() => router.push("/admin-management")}
        >
          👤 Admins
        </span>

        <span className="mobile-link logout" onClick={logout}>
          🚪 Logout
        </span>
      </div>
    </>
  );
}
