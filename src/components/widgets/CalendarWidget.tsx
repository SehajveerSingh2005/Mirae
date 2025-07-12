import React from "react";

const CalendarWidget = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return (
    <div className="rounded-2xl shadow-sm p-6 flex flex-col gap-2 transition" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <span className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{monthName} {year}</span>
      <div className="grid grid-cols-7 gap-1 text-center text-xs" style={{ color: 'var(--muted)' }}>
        {["S","M","T","W","T","F","S"].map((d, i) => <span key={d + i} className="font-bold">{d}</span>)}
        {Array(firstDay).fill(null).map((_, i) => <span key={"empty-"+i}></span>)}
        {days.map(day => <span key={day} className="rounded-full px-1 py-0.5" style={day === now.getDate() ? { background: 'var(--accent)', color: '#fff', fontWeight: 600 } : {}}>{day}</span>)}
      </div>
    </div>
  );
};

export default CalendarWidget; 