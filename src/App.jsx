import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Card, CardHeader, CardContent, Badge } from "@/components/ui/card";
import PhotoCard from "@/components/PhotoCard";
import LiftedPhoto from "@/components/LiftedPhoto";
import Ballpit from "@/components/ballpit/Ballpit";

// 30 Aug 2025 00:00 WITA = 2025-08-29T16:00:00Z (UTC)
const TARGET_WITA_ISO = "2025-08-29T17:00:00Z";

// === DEBUG FLAG === (bisa juga pakai ?force=1 di URL)
const FORCE_CELEBRATE_DEFAULT = false;
function getUrlForce() {
  try {
    return new URLSearchParams(window.location.search).get("force") === "1";
  } catch {
    return false;
  }
}
const FORCE_CELEBRATE = FORCE_CELEBRATE_DEFAULT || getUrlForce();

function useCountdown(targetIso) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, done: diff <= 0 };
}

function AnimatedGradient() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-20 animate-[gradientShift_14s_ease_infinite]
                 bg-[radial-gradient(110%_80%_at_10%_0%,rgba(255,192,203,0.65),transparent_60%),_radial-gradient(90%_70%_at_100%_20%,rgba(147,197,253,0.7),transparent_55%),_linear-gradient(135deg,#ffc1d6_0%,#c1e8ff_100%)]"
      style={{ backgroundBlendMode: "screen,screen,normal" }}
    />
  );
}
function FloatingOrbs() {
  const arr = new Array(8).fill(0);
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {arr.map((_, i) => (
        <motion.div
          key={i}
          className="absolute size-24 sm:size-32 rounded-full bg-white/20 blur-xl"
          style={{ left: `${(i * 83) % 100}%`, top: `${(i * 37) % 100}%` }}
          animate={{
            y: [0, -16, 0, 16, 0],
            x: [0, 8, -8, 4, 0],
            opacity: [0.25, 0.5, 0.35, 0.6, 0.25],
          }}
          transition={{
            duration: 10 + (i % 5),
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** Confetti ringan: total 10 partikel sekali tembak */
function lightConfetti() {
  const colors = ["#ffb6d5", "#c7e2ff", "#ffd1e6", "#bfe4ff", "#ffffff"];
  const shots = [
    {
      count: 2,
      angle: 60,
      spread: 70,
      startVelocity: 55,
      origin: { x: 0, y: 0.5 },
    },
    {
      count: 2,
      angle: 120,
      spread: 70,
      startVelocity: 55,
      origin: { x: 1, y: 0.5 },
    },
    { count: 2, spread: 360, startVelocity: 45, origin: { x: 0.5, y: 0.3 } },
    { count: 2, spread: 120, startVelocity: 35, origin: { x: 0.5, y: 0.0 } },
    { count: 2, spread: 120, startVelocity: 35, origin: { x: 0.5, y: 1.0 } },
  ];
  shots.forEach((s) => confetti({ ...s, colors }));
}

function CountdownDisplay({ targetIso, onFinish }) {
  const { days, hours, minutes, seconds, done } = useCountdown(targetIso);
  useEffect(() => {
    if (done) onFinish && onFinish();
  }, [done, onFinish]);

  return (
    <Card className="max-w-[960px] w-[92%] mx-auto bg-white/15 text-white shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-3">
          <Badge className="bg-pink-500/40 border-pink-200/50">Countdown</Badge>
          <Badge className="bg-sky-500/40 border-sky-200/50">
            30 Aug 2025 · 00:00 WITA
          </Badge>
        </div>
        <h1
          className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight"
          style={{ fontFamily: "Quicksand, system-ui" }}
        >
          Hitung Mundur Ke Ulang Tahun{" "}
          <span className="text-pink-200">Nurhilalia</span>
        </h1>
        <p className="mt-2 opacity-90">
          Siapkan confetti dan senyum paling manis ✨🎀
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 sm:gap-5 text-center">
          {[
            { label: "Hari", value: days },
            { label: "Jam", value: hours },
            { label: "Menit", value: minutes },
            { label: "Detik", value: seconds },
          ].map((b, idx) => (
            <div key={idx} className="relative">
              <div className="absolute inset-0 rounded-2xl bg-white/10 blur-sm" />
              <div className="relative rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-pink-400/30 to-sky-400/30 border border-white/30">
                <div
                  className="text-4xl sm:text-6xl font-extrabold tabular-nums drop-shadow"
                  style={{ fontFamily: "Quicksand, system-ui" }}
                >
                  {String(b.value).padStart(2, "0")}
                </div>
                <div className="mt-2 text-sm opacity-90">{b.label}</div>
              </div>
            </div>
          ))}
        </div>
        <Ballpit />
      </CardContent>
    </Card>
  );
}

function Celebration() {
  useEffect(() => {
    lightConfetti();
  }, []); // ringan

  return (
    <div className="max-w-6xl w-[92%] mx-auto text-white">
      {/* Judul muncul lalu sedikit geser */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          initial={{ x: 0 }}
          animate={{ x: 0 }}
          transition={{ duration: 0 }}
          className="text-center text-4xl sm:text-6xl font-extrabold drop-shadow"
          style={{ fontFamily: "Quicksand, system-ui" }}
        >
          Selamat Ulang Tahun, <span className="text-pink-200">Nurhilalia</span>{" "}
          🎂✨
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-3 text-center opacity-95"
        >
          Semoga tahun ini penuh tawa, hal seru, dan kejutan manis—kayak web ini
          😆
        </motion.p>
      </motion.div>

      {/* Foto (non-3D) + chibi mengangkat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 0.9 }}
        className="mt-10 flex justify-center"
      >
        <LiftedPhoto cardSizeClass="w-64 h-64 sm:w-72 sm:h-72">
          <PhotoCard src="/assets/picts.png" className="w-full h-full" />
        </LiftedPhoto>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [celebrate, setCelebrate] = useState(FORCE_CELEBRATE);
  const handleFinish = useCallback(() => setCelebrate(true), []);

  return (
    <div
      className="min-h-dvh relative text-white overflow-hidden"
      style={{ fontFamily: "Quicksand, system-ui" }}
    >
      <AnimatedGradient />
      <FloatingOrbs />
      <div className="relative z-10 py-10 sm:py-16">
        <div className="mx-auto w-[92%] max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/20 border border-white/30 grid place-items-center">
              <span className="text-xl">🎀</span>
            </div>
            <div>
              <div className="text-sm uppercase tracking-wider opacity-80">
                Birthday
              </div>
              <div className="font-extrabold">Nurhilalia</div>
            </div>
          </div>
          <Badge className="hidden sm:inline-flex bg-white/25 border-white/40">
            Made with ❤ by Reza
          </Badge>
        </div>

        <main className="mt-10 sm:mt-14">
          <AnimatePresence mode="wait">
            {!celebrate ? (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
              >
                <CountdownDisplay
                  targetIso={TARGET_WITA_ISO}
                  onFinish={handleFinish}
                />
              </motion.div>
            ) : (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
              >
                <Celebration />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-pink-300/20 blur-3xl" />
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-sky-300/20 blur-3xl" />
      </div>
    </div>
  );
}
