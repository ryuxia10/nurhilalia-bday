import React from "react";

// Bubble 8-bit tegak + ukuran fix
export function PixelBubble({ children, className = "", arrow = "left" }) {
  // posisi anak panah (diamond kecil) di sisi kiri/kanan bubble
  const arrowPos =
    arrow === "left" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2";

  return (
    <div
      className={`relative inline-flex items-center justify-center
         rounded-md border-4 border-black/30 bg-white/90 text-gray-900
         px-3 py-2 shadow-[6px_6px_0_0_rgba(0,0,0,0.25)]
         w-56 min-h-[48px] ${className}`}
      style={{
        fontFamily: '"Press Start 2P", system-ui',
        imageRendering: "pixelated",
      }}
    >
      <span className="block text-[11px] sm:text-xs leading-tight text-center">
        {children}
      </span>

      {/* anak panah (diamond) */}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${arrowPos}
           w-3 h-3 bg-white/90 border-2 border-black/30 rotate-45
           shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]`}
      />
    </div>
  );
}

export default PixelBubble;
