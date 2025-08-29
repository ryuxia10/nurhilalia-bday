import React from "react";
export const Card = ({ className = "", children }) => (
  <div
    className={`rounded-2xl shadow-xl backdrop-blur-xl bg-white/10 border border-white/20 ${className}`}
  >
    {children}
  </div>
);
export const CardHeader = ({ className = "", children }) => (
  <div className={`p-4 sm:p-6 border-b border-white/10 ${className}`}>
    {children}
  </div>
);
export const CardContent = ({ className = "", children }) => (
  <div className={`p-4 sm:p-6 ${className}`}>{children}</div>
);
export const Badge = ({ className = "", children }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-white/20 border border-white/30 ${className}`}
  >
    {children}
  </span>
);
