"use client";

import { useEffect, useRef } from "react";
import "./scroll-spin.css";

type ScrollSpinProps = {
  /** Public path holding the frames, e.g. "/bridge-spin". */
  frameDir: string;
  frameCount: number;
  /** Describes the subject once; every other frame is decorative. */
  alt: string;
  /** Filename prefix before the zero-padded index. */
  basename?: string;
  /** Digits the index is padded to. */
  pad?: number;
  className?: string;
};

const clamp = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function ScrollSpin({
  frameDir,
  frameCount,
  alt,
  basename = "turn_",
  pad = 3,
  className,
}: ScrollSpinProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const rig = rigRef.current;
    const holder = framesRef.current;
    if (!track || !rig || !holder) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const frames = Array.from(holder.children) as HTMLElement[];
    const NF = frames.length;
    if (NF < 2) return;

    let target = 0; // raw scroll progress, 0..1
    let cur = 0; // eased value actually rendered
    let spin = 0; // free rotation, so it keeps turning between scrolls
    let lit = -1; // index of the frame pair currently carrying opacity
    let running = false;
    let queued = 0;

    // Cached so the scroll path stays pure arithmetic and never reads layout.
    let top = 0;
    let travel = 1;

    function fit() {
      const rs = Math.max(
        0.46,
        Math.min(1, (window.innerWidth - 48) / 350, (window.innerHeight - 220) / 500),
      );
      rig!.style.setProperty("--bridge-spin-scale", rs.toFixed(3));
      top = track!.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, track!.offsetHeight - window.innerHeight);
    }

    function readProgress() {
      return clamp((window.scrollY - top) / travel);
    }

    function paint() {
      const spun = cur * 2 + spin; // two turns across the scrub, plus free spin
      // Two neighbouring frames carry opacity at once, so the sequence
      // dissolves rather than cutting, and only opacity is ever touched.
      const p = ((((spun % 1) + 1) % 1) * NF);
      const i = Math.floor(p) % NF;
      const j = (i + 1) % NF;
      const t = p - Math.floor(p);
      if (i !== lit) {
        if (lit >= 0) {
          frames[lit].style.opacity = "0";
          frames[(lit + 1) % NF].style.opacity = "0";
        }
        frames[i].style.opacity = "1";
        lit = i;
      }
      frames[j].style.opacity = t.toFixed(3);
    }

    function loop() {
      const diff = target - cur;
      cur += diff * 0.16; // eased scrub, no jitter, no timers
      spin += 0.0016; // keeps turning when the reader stops
      if (Math.abs(diff) < 0.00015) cur = target;
      paint();
      if (running) window.requestAnimationFrame(loop);
    }

    function onScrollFrame() {
      queued = 0;
      target = readProgress();
    }
    function onScroll() {
      if (!queued) queued = window.requestAnimationFrame(onScrollFrame);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          window.requestAnimationFrame(loop);
        } else if (!entry.isIntersecting) {
          running = false;
        }
      },
      { rootMargin: "20% 0px" },
    );
    io.observe(track);

    fit();
    target = cur = readProgress();
    paint();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", fit);

    return () => {
      running = false;
      io.disconnect();
      if (queued) window.cancelAnimationFrame(queued);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div className={className ? `bridge-spin-track ${className}` : "bridge-spin-track"} ref={trackRef}>
      <div className="bridge-spin-sticky">
        <div className="bridge-spin-rig" ref={rigRef}>
          <div className="bridge-spin-frames" ref={framesRef}>
            {Array.from({ length: frameCount }, (_, i) => (
              // Plain <img>: next/image adds wrappers and its own sizing, which
              // fights the opacity-only mutation this component relies on.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={`${frameDir}/${basename}${String(i).padStart(pad, "0")}.webp`}
                alt={i === 0 ? alt : ""}
                aria-hidden={i === 0 ? undefined : true}
                fetchPriority={i === 0 ? "high" : undefined}
                loading="eager"
                decoding="async"
                draggable={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
