// UPDATED WITH WIDER SECTIONS + FIXED NAVBAR OVERLAP
"use client";

import { useEffect, useState, useRef } from "react";

/**
 Event Management Page
 (layout expanded / fixed navbar overlap)
*/

export default function EventManagementPage() {
  // data
  const [discounts, setDiscounts] = useState([]);
  const [events, setEvents] = useState([]);
  const [slotOptions, setSlotOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // discount form
  const [percent, setPercent] = useState(10);
  const [until, setUntil] = useState("");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);

  // event form
  const [evTitle, setEvTitle] = useState("");
  const [evType, setEvType] = useState("current");
  const fileRef = useRef(null);
  const [uploadPreview, setUploadPreview] = useState(null);

  // UI
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const ALL_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    _loadAll();
    _loadSlotOptions();
  }, []);

  async function _loadAll() {
    setLoading(true);
    try {
      const [dRes, eRes] = await Promise.all([
        fetch("/api/discounts"),
        fetch("/api/events"),
      ]);
      setDiscounts((await dRes.json()).discounts || []);
      setEvents((await eRes.json()).events || []);
    } catch {
      setToast({ type: "error", text: "Failed to load data" });
    }
    setLoading(false);
  }

  async function _loadSlotOptions() {
    try {
      const res = await fetch("/api/pricing");
      const data = await res.json();
      const ts = data?.config?.timeSlots ?? data?.timeSlots ?? [];
      setSlotOptions(ts);
    } catch {}
  }

  function _showToast(type, text, ms = 2200) {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  }

  function toggleDay(d) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function selectAllSlots() {
    setSelectedSlots(slotOptions.map((s) => s.label));
  }
  function unselectAllSlots() {
    setSelectedSlots([]);
  }

  function onSlotsChangeFromSelect(e) {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSelectedSlots(values);
  }

  // ---------- create discount ----------
  async function openConfirmCreateDiscount() {
    if (!percent || percent <= 0)
      return _showToast("error", "Percent must be > 0");
    if (!until) return _showToast("error", "End date required");

    const today = new Date().toISOString().split("T")[0];
    if (until < today) return _showToast("error", "Date cannot be in the past");

    setConfirmModal({
      title: "Create Discount",
      description: (
        <div>
          <div>
            <strong>{percent}%</strong> until{" "}
            <strong>{new Date(until).toLocaleDateString()}</strong>
          </div>
          <div style={{ marginTop: 6 }}>
            Days: {days.length ? days.join(", ") : "All"}
          </div>
          <div style={{ marginTop: 6 }}>
            Slots:{" "}
            {selectedSlots.length
              ? selectedSlots.join(", ")
              : "All (no selection)"}
          </div>
          <div style={{ marginTop: 8 }}>{reason || "No reason provided"}</div>
        </div>
      ),
      onConfirm: async () => {
        const outSlots = selectedSlots.length ? selectedSlots : ["all"];
        try {
          const res = await fetch("/api/discounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              percent,
              until,
              reason,
              days,
              slots: outSlots,
            }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.message);
          _showToast("success", "Discount created");
          setPercent(10);
          setUntil("");
          setReason("");
          setDays([]);
          setSelectedSlots([]);
          await _loadAll();
        } catch (err) {
          _showToast("error", err.message);
        } finally {
          setConfirmModal(null);
        }
      },
    });
  }

  // ---------- create event ----------
  async function openConfirmCreateEvent() {
    if (!evTitle) return _showToast("error", "Title required");
    if (!uploadPreview) return _showToast("error", "Image required");

    setConfirmModal({
      title: "Add Event",
      description: (
        <div>
          <strong>{evTitle}</strong> • {evType}
          <div style={{ marginTop: 8 }}>
            <img src={uploadPreview} style={{ width: 200, borderRadius: 6 }} />
          </div>
        </div>
      ),
      onConfirm: async () => {
        try {
          const res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: evTitle,
              imageDataUrl: uploadPreview,
              type: evType,
            }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.message);
          _showToast("success", "Event added");
          setEvTitle("");
          setEvType("current");
          setUploadPreview(null);
          if (fileRef.current) fileRef.current.value = "";
          await _loadAll();
        } catch (err) {
          _showToast("error", err.message);
        } finally {
          setConfirmModal(null);
        }
      },
    });
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result);
    reader.readAsDataURL(f);
  }

  const currentEvents = events.filter((e) => e.type === "current");
  const futureEvents = events.filter((e) => e.type === "future");
  const todayISO = new Date().toISOString().split("T")[0];

  return (
    <div
      style={{
        padding: "28px 24px",
        paddingTop: "90px", // <<<<<< FIX: PREVENT CONTENT UNDER NAVBAR
        minHeight: "100vh",
        background: "#07120f",
        color: "white",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        .page-grid {
          width: 100%;
          max-width: 1700px;        /* <<<<<< WIDER PAGE  */
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;               /* <<<<<< MORE SPACE BETWEEN SECTIONS */
          align-items: start;
        }
        @media (max-width: 960px) {
          .page-grid {
            grid-template-columns: 1fr;
          }
        }
        .card {
          background: #0d241c;
          border-radius: 14px;
          padding: 22px;          /* <<<<<< WIDER CARD */
          box-shadow: 0 6px 18px rgba(0,0,0,0.45);
        }
        .btn { cursor:pointer; border-radius:8px; padding:8px 12px; font-weight:700; }
        .muted { color:#cfcfcf; font-size:13px; }
      `}</style>

      <div className="page-grid">
        {/* LEFT SIDE — DISCOUNTS */}
        <div>
          <section className="card">
            <h2 style={{ marginTop: 0, color: "#ffe27a" }}>
              Apply Seasonal Discount
            </h2>

            {/* Inputs row */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 120,
                }}
              >
                % Discount
                <input
                  type="number"
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  style={{
                    marginTop: 6,
                    padding: 8,
                    borderRadius: 6,
                    background: "#fff",
                    color: "#000",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column" }}>
                Ends on
                <input
                  type="date"
                  min={todayISO}
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  style={{
                    marginTop: 6,
                    padding: 8,
                    borderRadius: 6,
                    background: "#fff",
                    color: "#000",
                  }}
                />
              </label>

              <label
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                Reason (optional)
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional"
                  style={{
                    marginTop: 6,
                    padding: 8,
                    borderRadius: 6,
                    background: "#fff",
                    color: "#000",
                  }}
                />
              </label>
            </div>

            {/* Days */}
            <div style={{ marginTop: 15 }}>
              <div style={{ marginBottom: 8 }}>Days (click to toggle)</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ALL_DAYS.map((d) => {
                  const active = days.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      className="btn"
                      style={{
                        background: active ? "#ffe27a" : "transparent",
                        color: active ? "#000" : "#fff",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
                <button
                  onClick={() => setDays([])}
                  className="btn"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "red",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Slots */}
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>Select Slots (optional)</div>
                <div>
                  <button
                    onClick={selectAllSlots}
                    className="btn"
                    style={{
                      background: "#ffe27a",
                      color: "#000",
                      marginRight: 8,
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={unselectAllSlots}
                    className="btn"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                    }}
                  >
                    Unselect All
                  </button>
                </div>
              </div>

              <select
                multiple
                value={selectedSlots}
                onChange={onSlotsChangeFromSelect}
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: 12,
                  minHeight: 130,
                  background: "#fff",
                  color: "#000",
                  borderRadius: 8,
                }}
              >
                {slotOptions.map((slot) => (
                  <option key={slot._id ?? slot.label} value={slot.label}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 18 }}>
              <button
                onClick={openConfirmCreateDiscount}
                className="btn"
                style={{ background: "#2ecc71", color: "#000" }}
              >
                Preview & Confirm
              </button>
            </div>
          </section>

          {/* Active Discounts */}
          <section className="card" style={{ marginTop: 22 }}>
            <h3>Active Discounts</h3>
            {discounts.length === 0 ? (
              <div className="muted">No discounts</div>
            ) : (
              discounts.map((d) => (
                <div
                  key={d._id}
                  style={{
                    background: "#071a14",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {d.percent}% until{" "}
                      {new Date(d.until).toLocaleDateString()}
                    </div>
                    <div className="muted">{d.reason || "—"}</div>
                    <div className="muted">
                      Days: {d.days?.length ? d.days.join(", ") : "All"}
                    </div>
                    <div className="muted">Slots: {d.slots?.join(", ")}</div>
                  </div>

                  <button
                    onClick={() =>
                      setConfirmModal({
                        title: "Delete Discount",
                        description: (
                          <div>
                            Type <strong>DELETE</strong> to confirm deletion of{" "}
                            <br />
                            <em>
                              {d.percent}% until{" "}
                              {new Date(d.until).toLocaleDateString()}
                            </em>
                          </div>
                        ),
                        inputRequired: true,
                        onConfirm: async (val) => {
                          if (val !== "DELETE")
                            return _showToast("error", "You must type DELETE");
                          await fetch(`/api/discounts/${d._id}`, {
                            method: "DELETE",
                          });
                          _showToast("success", "Deleted");
                          await _loadAll();
                          setConfirmModal(null);
                        },
                      })
                    }
                    className="btn"
                    style={{
                      background: "#ff4d4d",
                      color: "#fff",
                      padding: "8px 20px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </section>
        </div>

        {/* RIGHT SIDE — EVENTS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Current Events */}
          <section className="card">
            <h2 style={{ marginTop: 0, color: "#ffe27a" }}>Current Events</h2>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <input
                style={{
                  padding: 8,
                  borderRadius: 6,
                  background: "#fff",
                  color: "#000",
                  minWidth: 180,
                }}
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />

              <input
                type="text"
                placeholder="Event title"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  background: "#fff",
                  color: "#000",
                  minWidth: 180,
                }}
              />

              <select
                value={evType}
                onChange={(e) => setEvType(e.target.value)}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  background: "#fff",
                  color: "#000",
                }}
              >
                <option value="current">Current</option>
                <option value="future">Future</option>
              </select>

              <button
                onClick={() =>
                  setConfirmModal({
                    title: "Preview Add Event",
                    description: (
                      <div>
                        <strong>{evTitle || "(no title)"}</strong>
                        <div style={{ marginTop: 10 }}>
                          {uploadPreview ? (
                            <img
                              src={uploadPreview}
                              style={{ width: 180, borderRadius: 6 }}
                            />
                          ) : (
                            <span className="muted">No image selected</span>
                          )}
                        </div>
                      </div>
                    ),
                    onConfirm: openConfirmCreateEvent,
                  })
                }
                className="btn"
                style={{ background: "#ffe27a", color: "#000" }}
              >
                Add event
              </button>
            </div>

            {/* Current event list */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 14,
                overflowX: "auto",
              }}
            >
              {currentEvents.length === 0 ? (
                <div className="muted">No current events</div>
              ) : (
                currentEvents.map((ev) => (
                  <div
                    key={ev._id}
                    style={{
                      minWidth: 240,
                      background: "#071614",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <img
                      src={ev.imageDataUrl}
                      alt={ev.title}
                      style={{
                        width: "100%",
                        height: 140,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                    <div style={{ marginTop: 8, fontWeight: 800 }}>
                      {ev.title}
                    </div>
                    <div className="muted">
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </div>

                    <button
                      onClick={() =>
                        setConfirmModal({
                          title: "Delete Event",
                          description: (
                            <div>
                              Type <strong>DELETE</strong> to delete
                              <br />
                              <em>{ev.title}</em>
                            </div>
                          ),
                          inputRequired: true,
                          onConfirm: async (val) => {
                            if (val !== "DELETE")
                              return _showToast("error", "Must type DELETE");
                            await fetch(`/api/events/${ev._id}`, {
                              method: "DELETE",
                            });
                            _showToast("success", "Deleted");
                            await _loadAll();
                            setConfirmModal(null);
                          },
                        })
                      }
                      className="btn"
                      style={{
                        background: "#ff4d4d",
                        color: "#fff",
                        marginTop: 12,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Future events */}
          <section className="card">
            <h2 style={{ marginTop: 0, color: "#ffe27a" }}>Future Events</h2>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 14,
                overflowX: "auto",
              }}
            >
              {futureEvents.length === 0 ? (
                <div className="muted">No future events</div>
              ) : (
                futureEvents.map((ev) => (
                  <div
                    key={ev._id}
                    style={{
                      minWidth: 240,
                      background: "#071614",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <img
                      src={ev.imageDataUrl}
                      alt={ev.title}
                      style={{
                        width: "100%",
                        height: 140,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />

                    <div style={{ marginTop: 8, fontWeight: 800 }}>
                      {ev.title}
                    </div>
                    <div className="muted">
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </div>

                    <button
                      onClick={() =>
                        setConfirmModal({
                          title: "Delete Event",
                          description: (
                            <div>
                              Type <strong>DELETE</strong> to delete
                              <br />
                              <em>{ev.title}</em>
                            </div>
                          ),
                          inputRequired: true,
                          onConfirm: async (val) => {
                            if (val !== "DELETE")
                              return _showToast("error", "Must type DELETE");
                            await fetch(`/api/events/${ev._id}`, {
                              method: "DELETE",
                            });
                            _showToast("success", "Deleted");
                            await _loadAll();
                            setConfirmModal(null);
                          },
                        })
                      }
                      className="btn"
                      style={{
                        background: "#ff4d4d",
                        color: "#fff",
                        marginTop: 12,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            background: toast.type === "success" ? "#2ecc71" : "#ff4d4d",
            padding: "10px 16px",
            borderRadius: 8,
            color: "#000",
            fontWeight: 700,
          }}
        >
          {toast.text}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          modal={confirmModal}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

function ConfirmModal({ modal, onClose }) {
  const { title, description, inputRequired, onConfirm } = modal;

  const [inputValue, setInputValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirmHandler() {
    setError("");
    if (inputRequired && inputValue !== "DELETE") {
      return setError('Please type "DELETE"');
    }

    try {
      setBusy(true);
      await onConfirm(inputValue);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#0b100e",
          padding: 24,
          borderRadius: 12,
          width: "92%",
          maxWidth: 520,
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, color: "#ffe27a" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 22,
            }}
          >
            ✖
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {typeof description === "string" ? description : description}
        </div>

        {inputRequired && (
          <input
            style={{
              width: "100%",
              marginTop: 16,
              padding: 10,
              borderRadius: 8,
              background: "#fff",
              color: "#000",
            }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Type "DELETE"'
          />
        )}

        {error && (
          <div style={{ color: "#ff4d4d", fontWeight: 700, marginTop: 10 }}>
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "#fff",
            }}
          >
            Cancel
          </button>

          <button
            onClick={confirmHandler}
            disabled={busy}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#2ecc71",
              color: "#000",
              fontWeight: 800,
            }}
          >
            {busy ? "Working..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
