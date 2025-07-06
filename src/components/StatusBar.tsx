"use client";

import { useEffect, useState } from "react";

interface StatusBarProps {
  wordCount: number;
}

const StatusBar = ({ wordCount }: StatusBarProps) => {
  const [charCount, setCharCount] = useState(0);
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    // Update date/time every second
    const interval = setInterval(() => {
      setDateTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Optionally, you can pass charCount as a prop if available

  return (
    <footer className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg border-t border-white/30 dark:border-gray-800/60 p-4 text-sm text-gray-700 dark:text-gray-300 shadow-lg rounded-b-2xl m-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="font-medium">Words:</span> <span className="ml-1 text-blue-700 dark:text-blue-300">{wordCount}</span>
        <span className="font-medium ml-4">Characters:</span> <span className="ml-1 text-purple-700 dark:text-purple-300">{charCount}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-medium">{dateTime}</span>
        <span className="ml-4 text-green-600 dark:text-green-400 font-semibold">● Synced</span>
      </div>
    </footer>
  );
};

export default StatusBar; 