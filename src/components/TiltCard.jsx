import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const TiltCard = ({
  src = "/assets/picts.png",
  className = "w-64 h-64 sm:w-72 sm:h-72",
}) => {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [floatY, setFloatY] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const resolvedSrc = useMemo(() => {
    if (!src) return "";
    if (/^https?:\/\//i.test(src)) return src;
    const base = import.meta?.env?.BASE_URL ? import.meta.env.BASE_URL : "/";
    const clean = src.startsWith("/") ? src.slice(1) : src;
    return base.replace(/\/+$/, "/") + clean;
  }, [src]);

  useEffect(() => {
    let raf,
      t = 0;
    const loop = () => {
      t += 0.02;
      setFloatY(Math.sin(t) * 6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 2 - 1;
    const py = (y / rect.height) * 2 - 1;
    setTilt({ ry: px * 10, rx: -py * 10 });
  }, []);
  const onLeave = useCallback(() => setTilt({ rx: 0, ry: 0 }), []);

  return (
    <div className="perspective-[1200px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={`relative ${className} [transform-style:preserve-3d]`}
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        {/* glow belakang */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-300/30 to-sky-300/30 blur-2xl -z-10" />
        {/* frame */}
        <div className="absolute inset-0 rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl shadow-2xl" />

        {/* BACKGROUND fallback (selalu render) */}
        <div
          className="absolute inset-3 rounded-2xl bg-center bg-cover"
          style={{
            backgroundImage: `url("${resolvedSrc}")`,
            transform: `translateZ(38px) translateY(${floatY}px)`,
          }}
        />

        {/* IMG utama (akan fade-in kalau berhasil load) */}
        <img
          src={resolvedSrc}
          alt="birthday"
          loading="eager"
          className="absolute inset-3 rounded-2xl object-cover w-[calc(100%-0.75rem)] h-[calc(100%-0.75rem)] z-10 transition-opacity duration-300"
          style={{
            transform: `translateZ(40px) translateY(${floatY}px)`,
            opacity: imgLoaded && !imgError ? 1 : 0,
          }}
          onLoad={() => {
            setImgLoaded(true);
            setImgError(false);
          }}
          onError={() => {
            setImgError(true);
            setImgLoaded(false);
          }}
          draggable={false}
        />

        {/* overlay debug bila gambar gagal */}
        {imgError && (
          <div
            className="absolute inset-3 z-20 grid place-items-center rounded-2xl bg-white/70 text-gray-800 text-center p-3"
            style={{ transform: `translateZ(41px)` }}
          >
            <div className="text-xs leading-relaxed">
              <div className="font-semibold mb-1">Gambar tidak ditemukan</div>
              <div>Taruh file di:</div>
              <div className="font-mono mt-1">public/assets/picts.png</div>
              <div className="opacity-70 mt-1 break-all">{resolvedSrc}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TiltCard;
