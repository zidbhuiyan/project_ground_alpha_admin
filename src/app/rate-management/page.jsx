// src/app/rate-management/page.jsx
"use client";

import { useEffect, useState } from "react";

export default function RateManagementPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // local editable states
  const [weekdayDays, setWeekdayDays] = useState([]);
  const [weekendDays, setWeekendDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  // original snapshot for diffing
  const [originalConfig, setOriginalConfig] = useState(null);

  // modal state
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [changedSummary, setChangedSummary] = useState({ days: [], slots: [] });
  const [savingAll, setSavingAll] = useState(false);

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
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/pricing");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load config");

      // data must be { config: { weekdayDays, weekendDays, timeSlots } }
      const c = data.config || {};
      setConfig(c);

      setWeekdayDays(c.weekdayDays || []);
      setWeekendDays(c.weekendDays || []);
      setTimeSlots(
        (c.timeSlots || []).map((ts) => ({
          ...(ts || {}),
          label: ts.label || "",
        }))
      );

      setOriginalConfig({
        weekdayDays: [...(c.weekdayDays || [])],
        weekendDays: [...(c.weekendDays || [])],
        timeSlots: (c.timeSlots || []).map((ts) => ({ ...(ts || {}) })),
      });
    } catch (err) {
      console.error(err);
      setMessage("Failed to load configuration");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 2500);
    }
  }

  function toggleDay(day, which) {
    if (which === "weekday") {
      setWeekdayDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
      setWeekendDays((prev) => prev.filter((d) => d !== day));
    } else {
      setWeekendDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
      setWeekdayDays((prev) => prev.filter((d) => d !== day));
    }
  }

  function changeLocalPrice(index, field, value) {
    setTimeSlots((prev) => {
      const copy = [...prev];
      if (field === "weekdayPrice" || field === "weekendPrice") {
        copy[index] = {
          ...copy[index],
          [field]: value === "" ? "" : Number(value),
        };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  }

  // Build changes summary and show popup
  function handlePrepareSaveAll() {
    if (!originalConfig) return;

    const daysChanges = [];
    const addedWeekdays = weekdayDays.filter(
      (d) => !originalConfig.weekdayDays.includes(d)
    );
    const removedWeekdays = originalConfig.weekdayDays.filter(
      (d) => !weekdayDays.includes(d)
    );
    const addedWeekends = weekendDays.filter(
      (d) => !originalConfig.weekendDays.includes(d)
    );
    const removedWeekends = originalConfig.weekendDays.filter(
      (d) => !weekendDays.includes(d)
    );

    if (
      addedWeekdays.length ||
      removedWeekdays.length ||
      addedWeekends.length ||
      removedWeekends.length
    ) {
      daysChanges.push({
        addedWeekdays,
        removedWeekdays,
        addedWeekends,
        removedWeekends,
      });
    }

    const slotChanges = [];
    const origSlots = originalConfig.timeSlots || [];
    timeSlots.forEach((slot, idx) => {
      const orig = origSlots[idx] || {};
      const labelChanged = (slot.label || "") !== (orig.label || "");
      const weekdayChanged =
        Number(slot.weekdayPrice) !== Number(orig.weekdayPrice);
      const weekendChanged =
        Number(slot.weekendPrice) !== Number(orig.weekendPrice);

      if (labelChanged || weekdayChanged || weekendChanged) {
        slotChanges.push({
          index: idx,
          orig: {
            label: orig.label || "",
            weekdayPrice: orig.weekdayPrice ?? "",
            weekendPrice: orig.weekendPrice ?? "",
          },
          next: {
            label: slot.label || "",
            weekdayPrice: slot.weekdayPrice ?? "",
            weekendPrice: slot.weekendPrice ?? "",
          },
        });
      }
    });

    setChangedSummary({ days: daysChanges, slots: slotChanges });

    if (daysChanges.length === 0 && slotChanges.length === 0) {
      setMessage("No changes detected.");
      setTimeout(() => setMessage(""), 1600);
      return;
    }

    setShowConfirmPopup(true);
  }

  // send everything to server
  async function handleConfirmSave() {
    setSavingAll(true);
    try {
      const body = {
        weekdayDays,
        weekendDays,
        timeSlots,
      };

      const res = await fetch("/api/pricing/save-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");

      setShowConfirmPopup(false);
      setMessage("All changes saved.");
      await loadConfig();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to save");
    } finally {
      setSavingAll(false);
      setTimeout(() => setMessage(""), 2000);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 60,
          color: "white",
          background: "#06120b",
          minHeight: "100vh",
        }}
      >
        <h2 style={{ color: "#ffe27a" }}>Rate Management</h2>
        <p>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 40,
        color: "white",
        background: "#06120b",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ color: "#ffe27a", marginBottom: 12 }}>Rate Management</h2>

      {/* Days selector */}
      <div
        style={{
          maxWidth: 1000,
          margin: "12px auto 24px",
          background: "rgba(255,255,255,0.03)",
          padding: 18,
          borderRadius: 12,
        }}
      >
        <h3 style={{ color: "#fff" }}>Weekday days</h3>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          {ALL_DAYS.map((day) => {
            const active = weekdayDays.includes(day);
            return (
              <button
                key={"wd-" + day}
                onClick={() => toggleDay(day, "weekday")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: active ? "#ffe27a" : "transparent",
                  color: active ? "#000" : "#fff",
                  cursor: "pointer",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        <h3 style={{ color: "#fff", marginTop: 12 }}>Weekend days</h3>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          {ALL_DAYS.map((day) => {
            const active = weekendDays.includes(day);
            return (
              <button
                key={"we-" + day}
                onClick={() => toggleDay(day, "weekend")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: active ? "#ffe27a" : "transparent",
                  color: active ? "#000" : "#fff",
                  cursor: "pointer",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots table */}
      <div
        style={{
          maxWidth: 1000,
          margin: "20px auto",
          background: "rgba(255,255,255,0.03)",
          padding: 18,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 160px 160px 140px",
            gap: 12,
            alignItems: "center",
            marginBottom: 8,
            paddingBottom: 10,
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>
            Time slot
          </div>
          <div style={{ fontWeight: 800, color: "#ffe27a", fontSize: 15 }}>
            Weekday
          </div>
          <div style={{ fontWeight: 800, color: "#ffe27a", fontSize: 15 }}>
            Weekend
          </div>
          <div></div>
        </div>

        {timeSlots.map((slot, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 160px 140px",
              gap: 12,
              alignItems: "center",
              padding: "14px 0",
              borderBottom:
                idx !== timeSlots.length - 1
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "none",
            }}
          >
            {/* Editable label */}
            <div>
              <input
                type="text"
                value={slot.label || ""}
                onChange={(e) => changeLocalPrice(idx, "label", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  fontSize: 15,
                }}
              />
            </div>

            {/* Weekday input */}
            <div>
              <input
                type="number"
                value={slot.weekdayPrice === undefined ? "" : slot.weekdayPrice}
                onChange={(e) =>
                  changeLocalPrice(idx, "weekdayPrice", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  fontSize: 15,
                }}
              />
            </div>

            {/* Weekend input */}
            <div>
              <input
                type="number"
                value={slot.weekendPrice === undefined ? "" : slot.weekendPrice}
                onChange={(e) =>
                  changeLocalPrice(idx, "weekendPrice", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  fontSize: 15,
                }}
              />
            </div>

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <div
                style={{ color: "#bdbdbd", alignSelf: "center", fontSize: 13 }}
              >
                —
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save / Reset area fixed at bottom */}
      <div
        style={{
          maxWidth: 1000,
          margin: "20px auto",
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <button
          onClick={loadConfig}
          style={{
            padding: "10px 16px",
            background: "transparent",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer",
          }}
        >
          Reset
        </button>

        <button
          onClick={handlePrepareSaveAll}
          disabled={savingAll}
          style={{
            padding: "10px 16px",
            background: "#ffe27a",
            borderRadius: 8,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {savingAll ? "Saving..." : "Save All"}
        </button>
      </div>

      {/* floating message */}
      {message && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            background: "#222",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 10,
          }}
        >
          {message}
        </div>
      )}

      {/* confirm popup */}
      {showConfirmPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "90%",
              maxWidth: 760,
              background: "#0b100e",
              borderRadius: 12,
              padding: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              color: "white",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#ffe27a", textAlign: "center" }}>
              Confirm All Changes
            </h3>

            <div style={{ maxHeight: "56vh", overflowY: "auto", padding: 8 }}>
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{ fontWeight: 800, color: "#fff", marginBottom: 6 }}
                >
                  Days
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ color: "#ffe27a", fontWeight: 700 }}>
                      Weekday
                    </div>
                    <div style={{ color: "#fff" }}>
                      {weekdayDays.join(", ") || "—"}
                    </div>
                  </div>

                  <div style={{ minWidth: 180 }}>
                    <div style={{ color: "#ffe27a", fontWeight: 700 }}>
                      Weekend
                    </div>
                    <div style={{ color: "#fff" }}>
                      {weekendDays.join(", ") || "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{ fontWeight: 800, color: "#fff", marginBottom: 8 }}
                >
                  Slot changes
                </div>
                {changedSummary.slots.length === 0 ? (
                  <div style={{ color: "#bdbdbd" }}>
                    No price/label changes detected.
                  </div>
                ) : (
                  changedSummary.slots.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.03)",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#fff" }}>
                        {s.orig.label || `Slot ${s.index + 1}`}
                      </div>

                      <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
                        <div>
                          <div style={{ color: "#ffe27a", fontWeight: 700 }}>
                            Label
                          </div>
                          <div style={{ color: "#fff" }}>{s.next.label}</div>
                        </div>

                        <div>
                          <div style={{ color: "#ffe27a", fontWeight: 700 }}>
                            Weekday
                          </div>
                          <div style={{ color: "#fff" }}>
                            {s.orig.weekdayPrice} → {s.next.weekdayPrice}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: "#ffe27a", fontWeight: 700 }}>
                            Weekend
                          </div>
                          <div style={{ color: "#fff" }}>
                            {s.orig.weekendPrice} → {s.next.weekendPrice}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 12,
              }}
            >
              <button
                onClick={() => setShowConfirmPopup(false)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "transparent",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmSave}
                disabled={savingAll}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#2ecc71",
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                {savingAll ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
