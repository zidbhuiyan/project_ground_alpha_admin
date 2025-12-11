"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }

      // SUCCESS → Show animated popup
      setSuccessPopup(true);

      setTimeout(() => {
        setSuccessPopup(false);
        window.location.href = "/dashboard";
      }, 1800);
    } catch (err) {
      setError("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <>
      <style>{`
        /* ---------------- GLOBAL STYLES ---------------- */

        .login-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(180deg, #06120b 0%, #071a0f 100%);
          color: white;
          padding: 20px;
        }
        
        .login-box {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 220, 120, 0.22);
          backdrop-filter: blur(8px);
          padding: 45px 35px;
          border-radius: 18px;
          width: 100%;
          max-width: 430px;
          box-shadow: 0 10px 35px rgba(0,0,0,0.6);
          text-align: center;
        }
        
        .ga-title {
          font-size: 2.4rem;
          font-weight: 900;
          color: #ffdd66;
          margin-bottom: 4px;
        }
        
        .panel-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffffd9;
          margin-bottom: 32px;
        }

        .error-box {
          background: rgba(255, 50, 50, 0.2);
          border: 1px solid rgba(255, 80, 80, 0.4);
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 18px;
          color: #ffb3b3;
          font-weight: 600;
        }

        .login-label {
          font-size: 1.05rem;
          color: #f5f5f5;
          text-align: left;
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
        }
        
        .login-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255, 200, 80, 0.35);
          color: white;
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 22px;
          box-shadow: none;
        }
        
        .login-input::placeholder {
          color: rgba(255,255,255,0.55);
        }

        .show-pass {
          margin-top: -15px;
          margin-bottom: 18px;
          color: #ffe58e;
          cursor: pointer;
          font-size: 0.9rem;
          text-align: right;
        }
        
        .login-button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(90deg, #ffdd66, #ffcc33);
          color: black;
          font-size: 1.2rem;
          font-weight: 800;
          cursor: pointer;
          margin-top: 8px;
          transition: 0.25s ease;
          box-shadow: 0 0 10px rgba(0,0,0,0.4);
        }
        
        .login-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 18px rgba(0,0,0,0.55);
        }

        .spinner {
          width: 26px;
          height: 26px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top-color: #ffdd66;
          border-radius: 50%;
          margin: 10px auto;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ---------------- SUCCESS POPUP FIXED ---------------- */

        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(3px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999; /* ensures it stays on top */
        }
        
        .success-popup {
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 220, 120, 0.45);
          padding: 30px 42px;
          border-radius: 18px;
          color: #ffdd66;
          font-size: 1.5rem;
          font-weight: 800;
          text-align: center;
          box-shadow: 0 0 25px rgba(0,0,0,0.4);
        
          opacity: 0;
          transform: scale(0.6);
          animation: successFade 0.45s ease-out forwards,
                     successPulse 1.3s ease-in-out infinite;
        }
        
        @keyframes successFade {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes successPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        

        .forgot-link {
          margin-top: 16px;
          display: block;
          color: #ffe58e;
          font-size: 1rem;
          text-decoration: underline;
          cursor: pointer;
        }

      `}</style>

      {/* ---------------- SUCCESS POPUP ---------------- */}
      {successPopup && (
        <div className="success-overlay">
          <div className="success-popup">
            Welcome to
            <br />
            Ground Alpha
          </div>
        </div>
      )}

      <div className="login-container">
        <div className="login-box">
          <h1 className="ga-title">Ground Alpha</h1>
          <p className="panel-title">Admin Panel</p>

          {error && <div className="error-box">{error}</div>}

          <label className="login-label">User ID</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="login-label">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div
            className="show-pass"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide Password" : "Show Password"}
          </div>

          <button
            className="login-button"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <div className="spinner"></div> : "Login"}
          </button>

          <a className="forgot-link">Forgot Password?</a>
        </div>
      </div>
    </>
  );
}
