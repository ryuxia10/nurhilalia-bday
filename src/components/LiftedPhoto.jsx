import React, { useEffect, useState } from "react";
import { PixelBubble } from "@/components/ChibiGreeting";
import { greetingsLeft, greetingsRight } from "@/data/greetings";

/**
 * cardSizeClass harus sama dengan ukuran kartu/foto,
 * contoh: "w-64 h-64 sm:w-72 sm:h-72"
 */
const LiftedPhoto = ({
  children,
  cardSizeClass = "w-64 h-64 sm:w-72 sm:h-72",
}) => {
  const [idxL, setIdxL] = useState(0);
  const [idxR, setIdxR] = useState(0);

  useEffect(() => {
    const t1 = setInterval(
      () => setIdxL((i) => (i + 1) % greetingsLeft.length),
      2500
    );
    const t2 = setInterval(
      () => setIdxR((i) => (i + 1) % greetingsRight.length),
      2800
    );
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  return (
    <div className={`relative inline-block ${cardSizeClass}`}>
      {/* FOTO */}
      <div className="relative z-10 w-full h-full">{children}</div>

      {/* ==== CHIBI KIRI ==== */}
      <div
        className={
          `absolute z-20 select-none
           -left-14 sm:-left-16 bottom-0`
          /* EDIT POSISI CHIBI KIRI di sini:
             - Geser kiri/kanan: ubah -left-14 / sm:-left-16
             - Geser atas/bawah: ubah bottom-2 (atau pakai top-*)
          */
        }
      >
        {/* bubble di KIRI chibi (panah ke kanan → arrow="right") */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2">
          <PixelBubble arrow="right">{greetingsLeft[idxL]}</PixelBubble>
        </div>

        <img
          src="/assets/chibi/a.png"
          alt="chibi a"
          className="w-24 sm:w-28 drop-shadow-[0_12px_16px_rgba(255,105,180,0.35)]"
          draggable={false}
        />
      </div>

      {/* ==== CHIBI KANAN ==== */}
      <div
        className={
          `absolute z-20 select-none
           -right-14 sm:-right-16 bottom-0`
          /* EDIT POSISI CHIBI KANAN di sini:
             - Geser kiri/kanan: ubah -right-14 / sm:-right-16
             - Geser atas/bawah: ubah bottom-2 (atau pakai top-*)
          */
        }
      >
        {/* bubble di KANAN chibi (panah ke kiri → arrow="left") */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2">
          <PixelBubble arrow="left">{greetingsRight[idxR]}</PixelBubble>
        </div>

        <img
          src="/assets/chibi/b.png"
          alt="chibi b"
          className="w-24 sm:w-28 drop-shadow-[0_12px_16px_rgba(147,197,253,0.35)]"
          draggable={false}
        />
      </div>

      {/* titik sentuh di sudut foto (opsional kosmetik) */}
      <div className="pointer-events-none absolute inset-0 z-[15]">
        <div className="absolute left-0 bottom-0 translate-x-[-6px] translate-y-[6px] size-4 rounded-full bg-black/15 blur-[2px]" />
        <div className="absolute right-0 bottom-0 translate-x-[6px] translate-y-[6px] size-4 rounded-full bg-black/15 blur-[2px]" />
      </div>
    </div>
  );
};

export default LiftedPhoto;
