"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsView, setStatsView] = useState("week"); // week | month | year

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Page>Loading dashboard…</Page>;
  if (!data) return <Page>Failed to load</Page>;

  const { todayBookings, tomorrowBookings, discounts, events, stats } = data;

  const activeStats =
    statsView === "week"
      ? stats.lastWeek
      : statsView === "month"
      ? stats.lastMonth
      : stats.lastYear;

  const statsTitle =
    statsView === "week"
      ? "Last Week"
      : statsView === "month"
      ? "Last Month"
      : "Last Year";

  return (
    <Page>
      {/* ================= TODAY ================= */}
      <Block title="📅 Today’s Bookings">
        <BookingList items={todayBookings} empty="No bookings today" />
      </Block>

      {/* ================= TOMORROW ================= */}
      <Block title="📅 Tomorrow’s Bookings">
        <BookingList items={tomorrowBookings} empty="No bookings tomorrow" />
      </Block>

      {/* ================= DISCOUNTS ================= */}
      <Block title="🔥 Discounts Going On">
        {discounts.length ? (
          <div style={discountList}>
            {discounts.map((d) => {
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(d.until).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              );

              const activeDays =
                d.days && d.days.length ? d.days.join(", ") : "All Days";

              return (
                <div key={d._id} style={discountCard}>
                  {/* LEFT – BIG % */}
                  <div style={discountLeft}>
                    <div style={discountPercent}>{d.percent}%</div>
                    <div style={discountOff}>OFF</div>
                  </div>

                  {/* RIGHT – CONTENT */}
                  <div style={discountRight}>
                    <Strong style={discountTitle}>
                      {d.reason || "Special Discount"}
                    </Strong>

                    <div style={discountInfoRow}>
                      <div>
                        <Muted>Active Days</Muted>
                        <div style={discountValue}>{activeDays}</div>
                      </div>

                      <div>
                        <Muted>Ends In</Muted>
                        <div style={discountValue}>
                          {daysLeft} day{daysLeft !== 1 && "s"}
                        </div>
                      </div>

                      <div>
                        <Muted>Valid Until</Muted>
                        <div style={discountValue}>{d.until.split("T")[0]}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Muted>No discounts available</Muted>
        )}
      </Block>

      {/* ================= EVENTS ================= */}
      <Block title="🎉 Current Events">
        <EventList items={events.current} />
      </Block>

      <Block title="⏳ Future Events">
        <EventList items={events.future} />
      </Block>

      {/* ================= STATS ================= */}
      <Block title="📊 Booking Statistics">
        <StatsToggle value={statsView} onChange={setStatsView} />
        <Stats title={statsTitle} data={activeStats} />
      </Block>
    </Page>
  );
}

/* ================= COMPONENTS ================= */

function BookingList({ items, empty }) {
  if (!items.length) return <Muted>{empty}</Muted>;

  return (
    <div>
      {/* HEADER */}
      <div style={bookingHeader}>
        <div>Slot Time</div>
        <div>Name</div>
        <div>Phone</div>
      </div>

      {/* ROWS */}
      {items.map((b) => (
        <div key={b._id} style={bookingRow}>
          <div style={bookingSlot}>{b.slotLabel}</div>
          <div style={bookingName}>{b.customerName}</div>
          <div style={bookingPhone}>{b.customerPhone || "—"}</div>
        </div>
      ))}
    </div>
  );
}

function EventList({ items }) {
  if (!items.length) return <Muted>No events</Muted>;

  return (
    <div style={eventSlider}>
      {items.map((e) => (
        <div key={e._id} style={eventCard}>
          <img src={e.imageDataUrl} alt={e.title} style={eventImage} />

          <Strong style={{ marginTop: 8, fontSize: 14 }}>{e.title}</Strong>
        </div>
      ))}
    </div>
  );
}

function EventCard({ event }) {
  const images = event.images?.length
    ? event.images
    : event.image
    ? [event.image]
    : [];

  return (
    <div style={eventCard}>
      {images.length ? (
        <div style={eventImageRow}>
          {images.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={event.title}
              style={eventImage}
              draggable={false}
            />
          ))}
        </div>
      ) : (
        <div style={eventImagePlaceholder}>No Image</div>
      )}

      <Strong style={{ marginTop: 8, fontSize: 14 }}>{event.title}</Strong>
    </div>
  );
}

function Stats({ title, data }) {
  return (
    <div style={{ marginTop: 14 }}>
      <Strong style={{ fontSize: 16, marginBottom: 12 }}>{title}</Strong>

      <div style={statsGrid}>
        <StatBlock
          label="Top 5 Most Booked Slots"
          items={data.mostBookedSlots}
        />
        <StatBlock
          label="Top 3 Least Booked Slots"
          items={data.leastBookedSlots}
        />
        <StatBlock label="Top 3 Busiest Days" items={data.busiestDays} isDate />
        <StatBlock label="Top 2 Quiet Days" items={data.quietDays} isDate />
      </div>
    </div>
  );
}

function StatBlock({ label, items, isDate }) {
  return (
    <div style={statCard}>
      <div style={statLabel}>{label}</div>

      {items.length ? (
        items.map((i, idx) => {
          const name =
            i.slotLabel || // slots
            i.day || // busiest / quiet days
            i.date || // fallback
            "—";

          const count = i.totalBookings ?? i.count ?? 0;

          return (
            <div key={idx} style={statRow}>
              <span style={{ textTransform: "capitalize" }}>{name}</span>
              <span style={statCount}>{count}</span>
            </div>
          );
        })
      ) : (
        <Muted>No data</Muted>
      )}
    </div>
  );
}

/* ================= TOGGLE ================= */

function StatsToggle({ value, onChange }) {
  return (
    <div style={toggleWrap}>
      {["week", "month", "year"].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            ...toggleBtn,
            background: value === v ? "#ffe27a" : "#0b2018",
            color: value === v ? "#000" : "#fff",
          }}
        >
          {v.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ================= UI WRAPPERS ================= */

function Page({ children }) {
  return (
    <div style={page}>
      <h1 style={title}>Dashboard</h1>
      {children}
    </div>
  );
}

function Block({ title, children }) {
  return (
    <section style={block}>
      <h2 style={blockTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Item({ children }) {
  return <div style={item}>{children}</div>;
}

function Strong({ children, style }) {
  return <div style={{ fontWeight: 800, ...style }}>{children}</div>;
}

function Muted({ children }) {
  return <div style={{ opacity: 0.6 }}>{children}</div>;
}

/* ================= STYLES ================= */

const page = {
  minHeight: "100vh",
  background: "#07120f",
  padding: 28,
  color: "#fff",
};

const title = {
  color: "#ffe27a",
  marginBottom: 20,
};

const block = {
  background: "#0b2018",
  padding: 16,
  borderRadius: 10,
  marginBottom: 18,
};

const blockTitle = {
  color: "#ffe27a",
  marginBottom: 10,
};

const item = {
  padding: "8px 0",
  borderBottom: "1px solid #1d3b2f",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
};

const toggleWrap = {
  display: "flex",
  gap: 8,
  marginBottom: 12,
};

const toggleBtn = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #1d3b2f",
  cursor: "pointer",
  fontSize: 12,
};

const eventSlider = {
  display: "flex",
  gap: 16,
  overflowX: "auto",
  paddingBottom: 6,
  scrollSnapType: "x mandatory",
};

const eventCard = {
  minWidth: 220,
  background: "#07120f",
  borderRadius: 8,
  padding: 10,
  scrollSnapAlign: "start",
};

const eventImageRow = {
  display: "flex",
  gap: 6,
  overflowX: "auto",
};

const eventImage = {
  width: 200,
  height: 120,
  objectFit: "cover",
  borderRadius: 6,
  flexShrink: 0,
};

const eventImagePlaceholder = {
  width: 200,
  height: 120,
  borderRadius: 6,
  background: "#1d3b2f",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.6,
  fontSize: 12,
};

const discountList = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

/* MAIN CARD */
const discountCard = {
  width: "100%",
  background: "linear-gradient(135deg, #ffe27a, #ffb703)",
  color: "#000",
  borderRadius: 16,
  padding: 22,
  display: "flex",
  gap: 22,
  alignItems: "center",
};

/* LEFT SIDE */
const discountLeft = {
  minWidth: 120,
  background: "#000",
  color: "#ffe27a",
  borderRadius: 14,
  padding: "20px 14px",
  textAlign: "center",
};

const discountPercent = {
  fontSize: 34,
  fontWeight: 900,
  lineHeight: 1,
};

const discountOff = {
  fontSize: 14,
  letterSpacing: 2,
  marginTop: 4,
};

/* RIGHT SIDE */
const discountRight = {
  flex: 1,
};

const discountTitle = {
  fontSize: 20,
  marginBottom: 14,
};

/* INFO GRID */
const discountInfoRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

const discountValue = {
  fontSize: 15,
  fontWeight: 700,
  marginTop: 4,
};

/* ================= BOOKINGS TABLE ================= */

const bookingHeader = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr",
  paddingBottom: 10,
  marginBottom: 8,
  borderBottom: "1px solid #1d3b2f",
  fontSize: 12,
  opacity: 0.6,
};

const bookingRow = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr",
  padding: "12px 0",
  borderBottom: "1px solid #1d3b2f",
  alignItems: "center",
};

const bookingSlot = {
  fontSize: 15,
  fontWeight: 800,
};

const bookingName = {
  fontSize: 14,
};

const bookingPhone = {
  fontSize: 13,
  opacity: 0.7,
};

/* ================= STATS GRID ================= */

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const statCard = {
  background: "#07120f",
  borderRadius: 10,
  padding: 14,
};

const statLabel = {
  fontSize: 13,
  opacity: 0.7,
  marginBottom: 8,
};

const statRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  fontSize: 14,
  borderBottom: "1px solid #1d3b2f",
};

const statCount = {
  fontWeight: 800,
  color: "#ffe27a",
};
