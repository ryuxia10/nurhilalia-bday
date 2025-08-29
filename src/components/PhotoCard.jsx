import React from "react";

/**
 * Pastikan gambarmu ada di: public/assets/picts.png
 * Pakai: <PhotoCard src="/assets/picts.png" className="w-64 h-64" />
 */
const PhotoCard = ({ src = "/assets/picts.png", className = "w-64 h-64" }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Border gradasi tipis */}
      <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-br from-pink-200/60 to-sky-200/60">
        <div className="w-full h-full rounded-[1.45rem] bg-white/30 backdrop-blur-sm" />
      </div>

      {/* Foto */}
      <img
        src={src}
        alt="Foto Nurhilalia"
        className="relative z-10 w-full h-full rounded-3xl object-cover shadow-xl shadow-pink-200/30"
        draggable={false}
      />

      {/* Bayangan landai */}
      <div className="absolute -z-0 left-4 right-4 -bottom-3 h-6 rounded-full bg-black/25 blur-xl" />
    </div>
  );
};

export default PhotoCard;
