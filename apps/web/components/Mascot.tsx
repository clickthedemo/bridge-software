"use client";

import { useEffect, useRef, useState } from "react";
import "./mascot.css";

type MascotProps = {
  /** Where she sits inside the nearest positioned ancestor. */
  className?: string;
  /** Described for screen readers only when she carries meaning; she does not. */
  alt?: string;
  /** Tap or click flares the ember on her pre-roll. Off by default. */
  interactive?: boolean;
};

/**
 * The Bridge mascot. She rises from behind whatever she is placed against the
 * first time that region is scrolled into view, then keeps a slow idle float.
 *
 * Decorative: aria-hidden, and the whole thing sits still under
 * prefers-reduced-motion rather than popping.
 */
export function Mascot({ className = "", alt = "", interactive = false }: MascotProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [risen, setRisen] = useState(false);
  const [animateLoop, setAnimateLoop] = useState(false);
  const [lit, setLit] = useState(false);
  const litTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* A pending timeout that fires after unmount would set state on a dead
     component, so it is always cleared. */
  useEffect(() => () => { if (litTimer.current) clearTimeout(litTimer.current); }, []);

  function flare() {
    if (litTimer.current) clearTimeout(litTimer.current);
    setLit(true);
    litTimer.current = setTimeout(() => setLit(false), 2600);
  }

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setRisen(true));
      return () => cancelAnimationFrame(frame);
    }
    // Mobile-first product: she animates on phones too. The animated WebP is
    // fetched only after she rises, and only when the connection is not
    // flagged as slow or data-saving.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const thrifty = Boolean(conn && (conn.saveData || /2g/.test(conn.effectiveType ?? "")));
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setAnimateLoop(!thrifty);
        setRisen(true);
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const art = (
    <>
      {/* Animated WebP, not a video: iOS Safari has no alpha support in
          WebM, so a <video> renders her on an opaque block. WebP alpha works
          everywhere, and it is a plain <img> so there is nothing to play. */}
      <img
        alt={alt}
        aria-hidden={alt ? undefined : true}
        className="bridge-mascot-art"
        decoding="async"
        height={518}
        loading="lazy"
        src={risen && animateLoop ? "/mascot/bridget-loop.webp" : "/mascot/bridget.webp"}
        width={400}
      />
      {/* The ember sits over the tip of the pre-roll in her raised hand.
          Percentages, not pixels, because she is sized with clamp(). */}
      {interactive && <span aria-hidden="true" className="bridge-mascot-ember" />}
    </>
  );

  if (!interactive) {
    return (
      <div className={`bridge-mascot ${className}`} data-risen={risen} ref={ref}>
        {art}
      </div>
    );
  }

  return (
    <button
      className={`bridge-mascot bridge-mascot-button ${className}`}
      data-lit={lit}
      data-risen={risen}
      onClick={flare}
      ref={ref as unknown as React.RefObject<HTMLButtonElement>}
      title="Light it"
      type="button"
    >
      <span className="visually-hidden">Light Bridget&apos;s pre-roll</span>
      {art}
    </button>
  );
}
