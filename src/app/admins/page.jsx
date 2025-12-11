"use client";

import { useEffect, useState } from "react";

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  // Password popup states
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [popupError, setPopupError] = useState("");

  // Delete popup states
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteNameInput, setDeleteNameInput] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Success message popup
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      if (!res.ok) return;
      const data = await res.json();

      setAdmins(data.admins);
      setCurrentAdmin(data.currentAdmin);
    } catch (e) {
      console.log("Error loading admins:", e);
    }
  };

  // Show delete popup
  const askDeleteAdmin = (admin) => {
    setDeleteTarget(admin);
    setDeleteNameInput("");
    setDeleteError("");
    setShowDeletePopup(true);
  };

  // Delete admin after verification
  const confirmDelete = async () => {
    if (
      deleteNameInput.trim() !==
      `${deleteTarget.firstName} ${deleteTarget.lastName}`
    ) {
      return setDeleteError("Name does not match! Type the full name exactly.");
    }

    const res = await fetch(`/api/admins/${deleteTarget._id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      return setDeleteError("Failed to delete admin.");
    }

    setShowDeletePopup(false);
    setSuccessMsg("Admin deleted successfully!");

    setTimeout(() => {
      setSuccessMsg("");
      fetchAdmins();
    }, 1500);
  };

  // Open password popup
  const openPasswordPopup = () => {
    setNewPass("");
    setConfirmPass("");
    setPopupError("");
    setShowPasswordPopup(true);
  };

  // Change password
  const changePassword = async () => {
    setPopupError("");

    if (!newPass || !confirmPass) {
      return setPopupError("Please fill out both fields.");
    }

    if (newPass !== confirmPass) {
      return setPopupError("Passwords do not match!");
    }

    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPass }),
    });

    if (!res.ok) return setPopupError("Failed to update password.");

    setShowPasswordPopup(false);
    setSuccessMsg("Password updated successfully!");

    setTimeout(() => {
      setSuccessMsg("");
      fetchAdmins();
    }, 1500);
  };

  const goToAddAdmin = () => {
    window.location.href = "/add_admin";
  };

  return (
    <>
      {/* ------------------------------------------------------ */}
      {/* --------------------- STYLES ------------------------- */}
      {/* ------------------------------------------------------ */}
      <style>{`
        .page-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0f0d, #091d16);
          padding: 120px 20px 60px;
          color: white;
        }

        .title {
          font-size: 2.3rem;
          font-weight: 900;
          color: #ffe27a;
          text-align: center;
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 800;
          text-align: center;
          margin: 40px 0 20px;
        }

        .section-title::after {
          content: "";
          width: 80px;
          height: 3px;
          background: #ffe27a;
          display: block;
          margin: 10px auto;
          border-radius: 6px;
        }

        .admins-list {
          max-width: 900px;
          margin: auto;
        }

        .admin-card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 25px;
          border-radius: 20px;
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          transition: 0.3s ease;
          margin-bottom: 20px;
        }

        .admin-card.small {
          transform: scale(0.94);
          padding: 18px;
        }

        .admin-card.highlight {
          border: 2px solid #ffe27a;
          background: rgba(255, 226, 120, 0.15);
          transform: scale(1.03);
        }

        .field {
          margin: 6px 0;
          font-size: 1rem;
        }

        .label {
          font-weight: 700;
          color: #ffe27a;
        }

        .admin-actions {
          display: flex;
          gap: 14px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 15px;
          border-radius: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }

        .btn-password {
          background: #ffe27a;
          color: black;
        }

        .btn-delete {
          background: #ff4d4d;
          color: white;
        }

        .add-admin-btn {
          background: #ffe27a;
          color: black;
          font-weight: 900;
          padding: 14px 20px;
          border-radius: 14px;
          display: block;
          margin: 30px auto 50px;
          cursor: pointer;
          border: none;
        }

        /* ---------- POPUP OVERLAY ---------- */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ---------- POPUP BOX ---------- */
        .popup-box {
          width: 90%;
          max-width: 420px;
          background: rgba(255,255,255,0.11);
          padding: 25px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(14px);
          position: relative;
          animation: scaleIn 0.25s ease;
        }

        @keyframes scaleIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .popup-title {
          text-align: center;
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 20px;
          color: #ffe27a;
        }

        .popup-input {
          width: 100%;
          padding: 12px;
          margin: 8px 0 15px;
          border-radius: 10px;
          border: 1px solid #ccc;
          outline: none;
          font-size: 1rem;
          background: white;
          color: black;
        }

        .popup-btn {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: #ffe27a;
          font-weight: 900;
          cursor: pointer;
        }

        .popup-close {
          position: absolute;
          right: 14px;
          top: 10px;
          cursor: pointer;
          font-size: 20px;
          font-weight: bold;
          color: white;
        }

        .popup-error {
          color: #ff4d4d;
          text-align: center;
          font-weight: 700;
          margin-bottom: 10px;
        }

        /* SUCCESS MESSAGE */
        .success-popup {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: #4caf50;
          color: white;
          padding: 14px 22px;
          border-radius: 12px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: fadeIn 0.3s ease;
          z-index: 3000;
        }
      `}</style>

      {/* ------------------------------------------------------ */}
      {/* ---------------------- MAIN PAGE ---------------------- */}
      {/* ------------------------------------------------------ */}

      <div className="page-container">
        <h1 className="title">Admin Accounts</h1>

        {/* ---------- MY PROFILE ---------- */}
        {currentAdmin && (
          <>
            <h2 className="section-title">My Profile</h2>

            <div className="admins-list">
              <div className="admin-card highlight">
                <div className="field">
                  <span className="label">Full Name:</span>{" "}
                  {currentAdmin.firstName} {currentAdmin.lastName}
                </div>
                <div className="field">
                  <span className="label">User ID:</span> {currentAdmin.userId}
                </div>
                <div className="field">
                  <span className="label">Phone:</span> {currentAdmin.phone}
                </div>
                <div className="field">
                  <span className="label">Email:</span> {currentAdmin.email}
                </div>
                <div className="field">
                  <span className="label">Date Added:</span>{" "}
                  {new Date(currentAdmin.createdAt).toLocaleString()}
                </div>

                <div className="admin-actions">
                  <button
                    className="btn btn-password"
                    onClick={openPasswordPopup}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Add Admin Button */}
            <button className="add-admin-btn" onClick={goToAddAdmin}>
              ➕ Add New Admin
            </button>
          </>
        )}

        {/* ---------- OTHER ADMINS ---------- */}
        <h2 className="section-title">Other Admins</h2>

        <div className="admins-list">
          {admins
            .filter((a) => a._id !== currentAdmin?._id)
            .map((admin) => (
              <div key={admin._id} className="admin-card small">
                <div className="field">
                  <span className="label">Full Name:</span> {admin.firstName}{" "}
                  {admin.lastName}
                </div>
                <div className="field">
                  <span className="label">User ID:</span> {admin.userId}
                </div>
                <div className="field">
                  <span className="label">Phone:</span> {admin.phone}
                </div>
                <div className="field">
                  <span className="label">Email:</span> {admin.email}
                </div>
                <div className="field">
                  <span className="label">Date Added:</span>{" "}
                  {new Date(admin.createdAt).toLocaleString()}
                </div>

                <div className="admin-actions">
                  <button
                    className="btn btn-delete"
                    onClick={() => askDeleteAdmin(admin)}
                  >
                    Delete Admin
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* ------------------- PASSWORD POPUP ------------------- */}
      {/* ------------------------------------------------------ */}

      {showPasswordPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div
              className="popup-close"
              onClick={() => setShowPasswordPopup(false)}
            >
              ✖
            </div>

            <div className="popup-title">Change Password</div>

            {/* Error Message */}
            {popupError && <div className="popup-error">{popupError}</div>}

            <input
              type="password"
              className="popup-input"
              placeholder="New Password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />

            <input
              type="password"
              className="popup-input"
              placeholder="Confirm Password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />

            <button className="popup-btn" onClick={changePassword}>
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ */}
      {/* ------------------- DELETE POPUP --------------------- */}
      {/* ------------------------------------------------------ */}

      {showDeletePopup && deleteTarget && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div
              className="popup-close"
              onClick={() => setShowDeletePopup(false)}
            >
              ✖
            </div>

            <div className="popup-title">Confirm Delete</div>

            <p
              style={{ textAlign: "center", marginBottom: 10, color: "white" }}
            >
              Type{" "}
              <b>
                {deleteTarget.firstName} {deleteTarget.lastName}
              </b>{" "}
              to confirm deletion.
            </p>

            {deleteError && <div className="popup-error">{deleteError}</div>}

            <input
              className="popup-input"
              placeholder="Enter admin full name"
              value={deleteNameInput}
              onChange={(e) => setDeleteNameInput(e.target.value)}
            />

            <button
              className="popup-btn"
              style={{ background: "#ff4d4d", color: "white" }}
              onClick={confirmDelete}
            >
              Delete Admin
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ */}
      {/* ------------------- SUCCESS POPUP -------------------- */}
      {/* ------------------------------------------------------ */}

      {successMsg && <div className="success-popup">{successMsg}</div>}
    </>
  );
}
