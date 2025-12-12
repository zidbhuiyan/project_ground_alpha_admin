// Updated code with phone number input and manual admin name input while keeping layout intact.
// (Please paste your original full file so I can accurately integrate the fields in the exact spots.)
// Updated code with phone number and admin name inputs
// (Entire updated file; layout preserved)

"use client";

import { useEffect, useState, useRef } from "react";

export default function ScheduleManagementPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);

  const [toast, setToast] = useState(null);

  // booking modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [modalSlotLabel, setModalSlotLabel] = useState("");
  const [modalBasePrice, setModalBasePrice] = useState(0);
  const [modalDiscountPrice, setModalDiscountPrice] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [adminName, setAdminName] = useState("");
  const [bookReason, setBookReason] = useState("");
  const [busy, setBusy] = useState(false);

  // cancel confirm
  const [confirmCancel, setConfirmCancel] = useState(null);

  // current admin first name (still auto-load)
  const [currentAdminFirstName, setCurrentAdminFirstName] = useState(null);

  const fileRef = useRef(null);

  useEffect(() => {
    _loadCurrentAdmin();
    loadAll();
  }, [date]);

  async function _loadCurrentAdmin() {
    try {
      const res = await fetch("/api/admins");
      if (!res.ok) return;
      const j = await res.json();
      if (j.currentAdmin && j.currentAdmin.firstName) {
        setCurrentAdminFirstName(j.currentAdmin.firstName);
      }
    } catch (err) {
      console.error("Failed to fetch current admin", err);
    }
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [pRes, dRes, bRes] = await Promise.all([
        fetch("/api/pricing"),
        fetch("/api/discounts"),
        fetch(`/api/bookings?date=${date}`),
      ]);

      const pJson = pRes.ok ? await pRes.json() : {};
      const dJson = dRes.ok ? await dRes.json() : { discounts: [] };
      const bJson = bRes.ok ? await bRes.json() : { bookings: [] };

      const ts = pJson?.config?.timeSlots ?? pJson?.timeSlots ?? [];
      setTimeSlots(ts || []);
      setPricingConfig(pJson?.config ?? null);
      setDiscounts(dJson.discounts || []);
      setBookings(bJson.bookings || []);
    } catch (err) {
      console.error("Load error:", err);
      showToast("error", "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }

  function showToast(type, text, ms = 2500) {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  }

  function isBooked(slotLabel) {
    return bookings.find((b) => b.slotLabel === slotLabel && !b.canceledAt);
  }

  function getBookingForSlot(slotLabel) {
    return bookings.find((b) => b.slotLabel === slotLabel);
  }

  function computeBasePrice(slotLabel) {
    if (!pricingConfig) return 0;
    const weekdayNames = pricingConfig.weekdayDays || [];
    const weekendNames = pricingConfig.weekendDays || [];

    const ts = (pricingConfig.timeSlots || []).find(
      (t) => t.label === slotLabel
    );
    const dayName = new Date(date).toLocaleDateString(undefined, {
      weekday: "long",
    });
    const isWeekend = weekendNames.includes(dayName);
    const basePrice = ts ? (isWeekend ? ts.weekendPrice : ts.weekdayPrice) : 0;
    return basePrice;
  }

  function computeDiscountForSlot(slotLabel) {
    if (!pricingConfig) return null;
    const dayName = new Date(date).toLocaleDateString(undefined, {
      weekday: "long",
    });
    const selected = new Date(date + "T00:00:00");

    const applicable = (discounts || []).filter((d) => {
      try {
        const selectedISO = date;

        if (!discountIsActiveForDate(d, selectedISO)) return false;

        const dayName = new Date(date).toLocaleDateString(undefined, {
          weekday: "long",
        });

        if (d.days && d.days.length && !d.days.includes(dayName)) return false;
        if (d.slots && d.slots.length && !d.slots.includes(slotLabel))
          return false;

        return true;
      } catch (e) {
        return false;
      }
    });

    if (!applicable.length) return null;

    const best = applicable.reduce(
      (acc, cur) => (cur.percent > acc.percent ? cur : acc),
      { percent: 0 }
    );
    const base = computeBasePrice(slotLabel);
    const discounted = Math.round(base * (1 - (best.percent || 0) / 100));
    return { percent: best.percent || 0, discountedPrice: discounted };
  }

  const todayISO = new Date().toISOString().split("T")[0];
  const tomorrowISO = new Date(Date.now() + 86400000)
    .toISOString()
    .split("T")[0];
  function dateIsPast(selectedDateISO) {
    return selectedDateISO < todayISO;
  }
  function dateIsToday(selectedDateISO) {
    return selectedDateISO === todayISO;
  }

  function openBookModal(slotLabel) {
    if (dateIsPast(date)) {
      showToast("error", "Cannot book past dates");
      return;
    }
    const existingActive = isBooked(slotLabel);
    if (existingActive) {
      showToast("error", "Slot already booked");
      return;
    }

    setModalSlotLabel(slotLabel);
    setModalBasePrice(computeBasePrice(slotLabel));
    const disc = computeDiscountForSlot(slotLabel);
    setModalDiscountPrice(disc ? disc.discountedPrice : null);

    // reset fields
    setCustomerName("");
    setCustomerPhone("");
    setAdminName(currentAdminFirstName || "");
    setBookReason("");

    setShowBookModal(true);
  }

  async function createBooking() {
    if (dateIsPast(date)) {
      showToast("error", "Cannot book past dates");
      return;
    }
    if (!customerName.trim()) {
      showToast("error", "Customer name required");
      return;
    }
    if (!adminName.trim()) {
      showToast("error", "Admin name required");
      return;
    }

    setBusy(true);
    try {
      const slotLabel = modalSlotLabel;
      const canceledRecord = bookings.find(
        (b) => b.slotLabel === slotLabel && b.canceledAt
      );

      const payload = {
        date,
        slotLabel,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        reason: bookReason || "",
        price: Number(modalDiscountPrice ?? modalBasePrice),
        bookedBy: adminName.trim(),
        bookedAt: new Date().toISOString(),
      };

      if (canceledRecord) {
        try {
          const patchRes = await fetch(`/api/bookings/${canceledRecord._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              canceledBy: null,
              canceledAt: null,
            }),
          });
          if (patchRes.ok) {
            showToast("success", "Slot re-booked");
            setShowBookModal(false);
            await loadAll();
            return;
          }
        } catch {}
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.message || "Failed to book");

      showToast("success", "Slot booked");
      setShowBookModal(false);
      await loadAll();
    } catch (err) {
      console.error(err);
      showToast("error", err.message);
    } finally {
      setBusy(false);
    }
  }

  function openCancelConfirm(booking) {
    if (dateIsPast(booking?.date)) {
      showToast("error", "Cannot cancel past bookings");
      return;
    }
    setConfirmCancel(booking);
  }

  async function confirmCancelFn() {
    if (!confirmCancel) return;
    if (dateIsPast(confirmCancel.date)) {
      showToast("error", "Cannot cancel past bookings");
      setConfirmCancel(null);
      return;
    }

    try {
      const patchRes = await fetch(`/api/bookings/${confirmCancel._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canceledBy: adminName || currentAdminFirstName || "Admin",
          canceledAt: new Date().toISOString(),
        }),
      });

      if (patchRes.ok) {
        showToast("success", "Booking cancelled");
        setConfirmCancel(null);
        await loadAll();
        return;
      }

      const delRes = await fetch(`/api/bookings/${confirmCancel._id}`, {
        method: "DELETE",
      });
      if (!delRes.ok) throw new Error("Cancel failed");

      showToast("success", "Booking cancelled");
    } catch (err) {
      showToast("error", err.message);
    }
    setConfirmCancel(null);
    await loadAll();
  }

  function groupSlotsDynamic(slots) {
    const morning = [],
      day = [],
      night = [],
      midnight = [];
    (slots || []).forEach((slot, index) => {
      if (index < 3) morning.push(slot);
      else if (index < 7) day.push(slot);
      else if (index < 11) night.push(slot);
      else midnight.push(slot);
    });
    return { morning, day, night, midnight };
  }

  const grouped = groupSlotsDynamic(timeSlots);

  function discountIsActiveForDate(discount, selectedDateISO) {
    const today = todayISO; // already defined above
    const selected = selectedDateISO;

    const created = discount.createdAt
      ? discount.createdAt.split("T")[0]
      : today; // assume today if missing

    const until = discount.until.split("T")[0];

    // If selected date is after discount's validity period -> NO
    if (selected > until) return false;

    // If discount created today -> it applies only for today or future
    if (created === today) {
      return selected >= today;
    }

    // If discount created earlier -> valid for any date >= created
    return selected >= created;
  }

  return (
    <div
      style={{
        padding: 28,
        minHeight: "100vh",
        background: "#07120f",
        color: "white",
      }}
    >
      <h1 style={{ color: "#ffe27a", marginBottom: 12, marginTop: 60 }}>
        Schedule Management
      </h1>

      <div style={{ marginBottom: 6, color: "#fff" }}>Date</div>

      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "center", // vertically aligns Date box + Refresh button
          justifyContent: "flex-start",
          marginBottom: 14,
        }}
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#fff",
            color: "#000",
          }}
        />

        <button
          onClick={() => loadAll()}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: "#ffe27a",
            color: "#000",
            fontWeight: 800,
          }}
        >
          Refresh
        </button>
      </div>

      {/* --- SLOT SECTIONS --- */}
      <div style={{ display: "grid", gap: 18 }}>
        {renderPhase("Morning", grouped.morning)}
        {renderPhase("Day", grouped.day)}
        {renderPhase("Night", grouped.night)}
        {renderPhase("Midnight", grouped.midnight)}
      </div>

      {/* --- BOOK MODAL --- */}
      {showBookModal && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, color: "#ffe27a" }}>Book Slot</h3>
              <button
                onClick={() => setShowBookModal(false)}
                style={closeBtnStyle}
              >
                ✖
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800 }}>{modalSlotLabel}</div>

              <div style={{ marginTop: 6, fontSize: 14 }}>
                <div style={{ color: "#cfcfcf" }}>
                  Regular: {modalBasePrice}
                </div>
                {modalDiscountPrice !== null && (
                  <div style={{ color: "#ffdede", fontWeight: 800 }}>
                    Discounted: {modalDiscountPrice}
                  </div>
                )}
              </div>

              <label style={{ display: "block", marginTop: 12 }}>
                Customer Name
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "block", marginTop: 8 }}>
                Customer Phone
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "block", marginTop: 8 }}>
                Admin Name
                <input
                  readOnly
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  style={{
                    ...inputStyle,
                    background: "grey", // light grey
                    cursor: "not-allowed", // indicates not editable
                  }}
                />
              </label>

              <label style={{ display: "block", marginTop: 8 }}>
                Comment: (optional)
                <input
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  onClick={() => setShowBookModal(false)}
                  style={cancelBtnStyle}
                >
                  Cancel
                </button>
                <button
                  onClick={createBooking}
                  style={confirmBtnStyle}
                  disabled={busy}
                >
                  {busy ? "Booking..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CANCEL CONFIRM --- */}
      {confirmCancel && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ marginTop: 0, color: "#ffe27a" }}>Cancel Booking</h3>
            <div style={{ marginTop: 8, color: "#ddd" }}>
              Cancel booking for <strong>{confirmCancel.slotLabel}</strong>?
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 14,
              }}
            >
              <button
                onClick={() => setConfirmCancel(null)}
                style={cancelBtnStyle}
              >
                No
              </button>
              <button onClick={confirmCancelFn} style={confirmBtnStyle}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            background: toast.type === "success" ? "#2ecc71" : "#ff4d4d",
            padding: "10px 14px",
            borderRadius: 8,
            color: "#000",
            fontWeight: 700,
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );

  // --- Render Phase ---
  function renderPhase(title, slots) {
    return (
      <section
        key={title}
        style={{ background: "#0b2018", borderRadius: 8, padding: 12 }}
      >
        <h3 style={{ marginTop: 0, color: "#ffe27a" }}>{title}</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 12,
          }}
        >
          {slots.map((slot) => {
            const bookedRec = getBookingForSlot(slot.label);
            const activeBooked = bookedRec && !bookedRec.canceledAt;
            const basePrice = computeBasePrice(slot.label);
            const disc = computeDiscountForSlot(slot.label);
            const displayPrice = disc ? disc.discountedPrice : basePrice;

            return (
              <div
                key={slot.label}
                style={{
                  background: dateIsPast(date)
                    ? "rgba(255,255,255,0.05)" // faded grey for past date
                    : activeBooked
                    ? "rgba(180,60,60,0.12)"
                    : "rgba(40,120,90,0.08)",
                  opacity: dateIsPast(date) ? 0.55 : 1,
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,

                  // ⭐ HIGHLIGHT TODAY & TOMORROW
                  border:
                    date === todayISO
                      ? "1px solid #ffe27a" // today = gold border
                      : date === tomorrowISO
                      ? "1px solid #00c8ff" // tomorrow = blue border
                      : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span style={{ fontWeight: 800 }}>
                      {slot.label}

                      {/* ⭐ PAST DATE BADGE */}
                      {dateIsPast(date) && (
                        <span
                          style={{
                            background: "#00c8ff",
                            color: "#000",
                            fontWeight: "bold",
                            padding: "2px 6px",
                            borderRadius: 6,
                            fontSize: 11,
                          }}
                        >
                          (Past date)
                        </span>
                      )}
                    </span>

                    {/* ⭐ TODAY TEXT BADGE */}
                    {date === todayISO && (
                      <span
                        style={{
                          background: "#ffe27a",
                          color: "#000",
                          fontWeight: "bold",
                          padding: "2px 6px",
                          borderRadius: 6,
                          fontSize: 11,
                        }}
                      >
                        Today
                      </span>
                    )}

                    {/* ⭐ TOMORROW TEXT BADGE */}
                    {date === tomorrowISO && (
                      <span
                        style={{
                          background: "#00c8ff",
                          color: "#000",
                          fontWeight: "bold",
                          padding: "2px 6px",
                          borderRadius: 6,
                          fontSize: 11,
                        }}
                      >
                        Tomorrow
                      </span>
                    )}
                  </div>

                  <div style={{ color: "#cfcfcf", fontSize: 13 }}>
                    {disc ? (
                      <>
                        <span
                          style={{
                            textDecoration: "line-through",
                            marginRight: 8,
                            fontWeight: "bold",
                            fontSize: 16,
                          }}
                        >
                          {basePrice} Taka
                        </span>
                        <span
                          style={{
                            color: "#ff4d4d",
                            fontWeight: "900",
                            fontSize: 18,
                          }}
                        >
                          {displayPrice} Taka
                        </span>
                      </>
                    ) : (
                      <div style={{ fontWeight: "bold", fontSize: 16 }}>
                        Price: {basePrice} Taka
                      </div>
                    )}
                  </div>

                  {disc && (
                    <div
                      style={{
                        color: "#FD1C03",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      Discount:{" "}
                      {disc.amountOff
                        ? `${disc.amountOff} Taka off`
                        : disc.percent
                        ? `${disc.percent}% off`
                        : ""}
                    </div>
                  )}

                  {activeBooked ? (
                    <>
                      <div
                        style={{
                          color: "#FFD700",
                          fontWeight: "bold",
                          fontSize: 15,
                        }}
                      >
                        Booked by: {bookedRec.customerName}
                      </div>
                      <div style={{ color: "#cfcfcf", fontSize: 13 }}>
                        Phone: {bookedRec.customerPhone || "—"}
                      </div>
                      <div
                        style={{
                          color: "#cfcfcf",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        Admin: {bookedRec.bookedBy}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        color: "#FFD700",
                        fontWeight: "bold",
                        fontSize: 15,
                      }}
                    >
                      Available
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {!activeBooked ? (
                    <button
                      onClick={() =>
                        !dateIsPast(date) && openBookModal(slot.label)
                      }
                      style={{
                        ...confirmBtnStyle,
                        opacity: dateIsPast(date) ? 0.4 : 1,
                        cursor: dateIsPast(date) ? "not-allowed" : "pointer",
                      }}
                      disabled={dateIsPast(date)}
                    >
                      Book
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        !dateIsPast(bookedRec?.date) &&
                        openCancelConfirm(bookedRec)
                      }
                      style={{
                        ...cancelBtnStyle,
                        opacity: dateIsPast(bookedRec?.date) ? 0.4 : 1,
                        cursor: dateIsPast(bookedRec?.date)
                          ? "not-allowed"
                          : "pointer",
                      }}
                      disabled={dateIsPast(bookedRec?.date)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
}

// ---- Styles ----
const modalBackdropStyle = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.6)",
  zIndex: 9999,
};

const modalCardStyle = {
  width: "92%",
  maxWidth: 520,
  background: "#0b100e",
  color: "#fff",
  borderRadius: 10,
  padding: 18,
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: 18,
  cursor: "pointer",
};

const inputStyle = {
  marginTop: 6,
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "#fff",
  color: "#000",
  width: "100%",
};

const cancelBtnStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "#ff4d4d",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  border: "none",
};

const confirmBtnStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "#2ecc71",
  color: "#000",
  fontWeight: 800,
  cursor: "pointer",
  border: "none",
};
