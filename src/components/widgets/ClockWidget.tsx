import React, { useState, useEffect } from "react";

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const hours = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center gap-2 transition" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', minHeight: 180 }}>
      <span className="text-5xl font-extrabold font-mono tracking-tight mb-2" style={{ color: 'var(--accent)', letterSpacing: '-0.04em' }}>{hours}</span>
      <span className="text-lg font-semibold mt-2" style={{ color: 'var(--foreground)' }}>{dateStr}</span>
    </div>
  );
};

export default ClockWidget; 