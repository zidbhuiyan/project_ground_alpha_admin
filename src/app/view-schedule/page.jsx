"use client";

import { useEffect, useState } from "react";

function getDayNameFromISO(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
  });
}

export default function ViewScheduleCalendar() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [timeSlots, setTimeSlots] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeek();
  }, [weekStart]);

  async function loadWeek() {
    setLoading(true);
    try {
      const weekDates = getWeekDates(weekStart);

      const [pricingRes, discountRes, ...bookingRes] = await Promise.all([
        fetch("/api/pricing"),
        fetch("/api/discounts"),
        ...weekDates.map((d) => fetch(`/api/bookings?date=${formatDate(d)}`)),
      ]);

      const pricingJson = await pricingRes.json();
      const discountJson = await discountRes.json();

      const slots =
        pricingJson?.config?.timeSlots || pricingJson?.timeSlots || [];

      let allBookings = [];
      for (const r of bookingRes) {
        const j = await r.json();
        allBookings.push(...(j.bookings || []));
      }

      setTimeSlots(slots);
      setPricingConfig(pricingJson.config);
      setDiscounts(discountJson.discounts || []);
      setBookings(allBookings);
    } catch (err) {
      console.error("Weekly calendar load failed", err);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- HELPERS ---------------- */

  function bookingFor(dateISO, slotLabel) {
    return bookings.find(
      (b) => b.date === dateISO && b.slotLabel === slotLabel && !b.canceledAt
    );
  }

  function computeBasePrice(dateISO, slotLabel) {
    if (!pricingConfig) return 0;

    const dayName = new Date(dateISO).toLocaleDateString(undefined, {
      weekday: "long",
    });

    const isWeekend = pricingConfig.weekendDays.includes(dayName);
    const slot = pricingConfig.timeSlots.find((s) => s.label === slotLabel);

    return slot ? (isWeekend ? slot.weekendPrice : slot.weekdayPrice) : 0;
  }

  function computeDiscount(dateISO, slotLabel, base) {
    const dayName = getDayNameFromISO(dateISO);

    const applicable = discounts.filter((d) => {
      const created = d.createdAt ? d.createdAt.split("T")[0] : todayISO;

      const until = d.until.split("T")[0];

      // ✅ strict date window
      if (dateISO < created || dateISO > until) return false;

      // ✅ day filtering
      if (d.days?.length && !d.days.includes(dayName)) return false;

      // ✅ slot filtering
      if (
        d.slots?.length &&
        !d.slots.includes("all") &&
        !d.slots.includes(slotLabel)
      )
        return false;

      return true;
    });

    if (!applicable.length) return null;

    const best = applicable.reduce(
      (a, b) => (b.percent > a.percent ? b : a),
      applicable[0]
    );

    return Math.round(base * (1 - best.percent / 100));
  }

  function groupedSlots(slots) {
    return {
      Morning: slots.slice(0, 3),
      Day: slots.slice(3, 7),
      Night: slots.slice(7, 11),
      Midnight: slots.slice(11),
    };
  }

  const todayISO = formatDate(new Date());
  const weekDates = getWeekDates(weekStart);
  const grouped = groupedSlots(timeSlots);

  /* ---------------- RENDER ---------------- */

  return (
    <div style={{ padding: 28, background: "#07120f", minHeight: "100vh" }}>
      <h1 style={{ color: "#ffe27a", marginTop: 60 }}>Weekly Calendar View</h1>

      {/* NAV */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={() => shiftWeek(-7)} style={navBtn}>
          ⬅ Previous
        </button>
        <div style={{ color: "#fff", fontWeight: 800 }}>
          {formatDate(weekStart)} – {formatDate(addDays(weekStart, 6))}
        </div>
        <button onClick={() => shiftWeek(7)} style={navBtn}>
          Next ➡
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#fff" }}>Loading…</div>
      ) : (
        <table style={table}>
          {/* ===== HEADER (DATES ONCE) ===== */}
          <thead>
            <tr>
              <th style={timeHeader}>Time</th>
              {weekDates.map((d) => {
                const iso = formatDate(d);
                const isToday = iso === todayISO;

                return (
                  <th
                    key={d.toISOString()}
                    style={{
                      ...dayCol,
                      background: isToday ? "#24382f" : dayCol.background,
                      borderBottom: isToday ? "3px solid #ffe27a" : "none",
                    }}
                  >
                    {d.toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                    })}

                    {isToday && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: "#ffe27a",
                          marginTop: 2,
                        }}
                      >
                        Today
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ===== BODY (PHASED) ===== */}
          {Object.entries(grouped).map(([phase, slots]) => (
            <tbody key={phase}>
              <tr>
                <td colSpan={8} style={phaseRow}>
                  {phase}
                </td>
              </tr>

              {slots.map((slot) => (
                <tr key={slot.label}>
                  <td style={timeCellSticky}>{slot.label}</td>

                  {weekDates.map((d) => {
                    const iso = formatDate(d);
                    const isPast = iso < todayISO;
                    const booking = bookingFor(iso, slot.label);
                    const base = computeBasePrice(iso, slot.label);
                    const discounted = computeDiscount(iso, slot.label, base);

                    return (
                      <td
                        key={`${iso}-${slot.label}`}
                        style={{
                          ...cell,
                          background: booking
                            ? "rgba(140,40,40,0.25)"
                            : "rgba(40,120,90,0.18)",
                          textAlign: "center", // center text
                          opacity: isPast ? 0.55 : 1,
                        }}
                      >
                        {booking ? (
                          <>
                            <div style={unavailable}>Booked by:</div>
                            <div style={name}>{booking.customerName}</div>
                            <div style={phone}>
                              📞 {booking.customerPhone || "—"}
                            </div>
                          </>
                        ) : (
                          <div style={available}>Available</div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center", // ⭐ horizontal center
                            alignItems: "center", // ⭐ vertical center
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <span
                            style={{
                              ...price,
                              fontSize: 13,
                              fontWeight: "bold", // ⭐ bold
                              textDecoration: discounted
                                ? "line-through"
                                : "none",
                              opacity: discounted ? 0.6 : 1,
                            }}
                          >
                            {base} Taka
                          </span>

                          {discounted && (
                            <span
                              style={{
                                ...discount,
                                fontSize: 15,
                                fontWeight: 900, // ⭐ extra bold
                              }}
                            >
                              {discounted} Taka
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      )}
    </div>
  );

  function shiftWeek(days) {
    setWeekStart(addDays(weekStart, days));
  }
}

/* ---------------- UTILS ---------------- */

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekDates(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/* ---------------- STYLES ---------------- */

const table = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1200,
};

const timeHeader = {
  background: "#0c241b",
  color: "#ffe27a",
  fontWeight: 900,
  padding: 10,
  position: "sticky",
  left: 0,
  zIndex: 3,
};

const dayCol = {
  background: "#0b2018",
  color: "#fff",
  padding: 10,
};

const timeCellSticky = {
  padding: 10,
  fontWeight: 800,
  background: "#0b2018",
  color: "#fff",
  position: "sticky",
  left: 0,
  zIndex: 2,
  minWidth: 180,
  borderRight: "2px solid #1d3b2f",
  textAlign: "center", // center text
};

const phaseRow = {
  background: "#07120f",
  color: "#ffe27a",
  fontWeight: 900,
  padding: "10px 14px",
  fontSize: 16,
};

const cell = {
  padding: 8,
  border: "1px solid #1d3b2f",
  verticalAlign: "top",
};

const unavailable = {
  color: "#ff4d4d",
  fontWeight: 900,
};

const available = {
  color: "#2ecc71",
  fontWeight: 800,
};

const name = {
  color: "#FFD700",
  fontWeight: 800,
};

const phone = {
  fontSize: 12,
  color: "#ddd",
};

const price = {
  fontSize: 12,
  color: "#fff",
  marginTop: 4,
};

const discount = {
  fontSize: 12,
  color: "#ff4d4d",
  fontWeight: 800,
};

const navBtn = {
  padding: "8px 14px",
  background: "#ffe27a",
  border: "none",
  borderRadius: 8,
  fontWeight: 800,
  cursor: "pointer",
};
