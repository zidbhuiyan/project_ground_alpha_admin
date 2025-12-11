"use client";

import React, { useState } from "react";

export default function AddAdmin() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userId: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [successPopup, setSuccessPopup] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.userId ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("All fields are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/api/add_admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // SHOW POPUP
        setSuccessPopup(true);

        // RESET FORM
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          userId: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });

        // Redirect after delay
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error.");
    }
  };

  return (
    <>
      <style>{`
        .addadmin-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(180deg, #06120b 0%, #071a0f 100%);
          color: white;
          padding: 20px;
        }

        .addadmin-box {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(120, 120, 120, 0.2);
          backdrop-filter: blur(6px);
          padding: 40px;
          border-radius: 18px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .title {
          font-size: 2rem;
          font-weight: 800;
          text-align: center;
          margin-bottom: 25px;
          color: #333;
        }

        .input-field {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          margin-bottom: 18px;
          font-size: 1rem;
          color: black;
        }

        .error-box {
          color: #ff0000;
          font-weight: bold;
          background: #ffe5e5;
          border: 1px solid #ff4d4d;
          padding: 8px;
          border-radius: 6px;
          margin-bottom: 12px;
          text-align: center;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(90deg, #ffe27a, #ffd54a);
          color: #333;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: 0.25s ease;
        }

        /* SUCCESS POPUP */
        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(3px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
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
          animation: successFade 0.4s ease-out forwards,
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
      `}</style>

      {successPopup && (
        <div className="success-overlay">
          <div className="success-popup">
            Admin Created
            <br />
            Successfully!
          </div>
        </div>
      )}

      <div className="addadmin-container">
        <div className="addadmin-box">
          <h2 className="title">Add New Admin</h2>

          {error && <div className="error-box">{error}</div>}

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              className="input-field"
              value={form.firstName}
              onChange={handleChange}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="input-field"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input-field"
            value={form.email}
            onChange={handleChange}
          />

          <input
            type="text"
            name="userId"
            placeholder="User ID"
            className="input-field"
            value={form.userId}
            onChange={handleChange}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            className="input-field"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password (min 8 chars)"
            className="input-field"
            value={form.password}
            onChange={handleChange}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Re-enter Password"
            className="input-field"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          <button className="submit-btn" onClick={handleSubmit}>
            Add Admin
          </button>
        </div>
      </div>
    </>
  );
}
