import React from "react";
export function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl font-semibold tracking-wide shadow hover:shadow-lg active:scale-95 transition bg-white/20 border border-white/30 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export default Button;
