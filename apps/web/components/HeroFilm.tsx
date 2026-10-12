"use client";

import { useEffect, useRef, useState } from "react";

type HeroFilmProps = {
  poster: string;
  src: string;
  label: string;
};

/**
 * The launch film in the home hero.
 *
 * It deliberately does NOT autoplay or preload. The poster is the only thing
 * that costs anything on first paint - the video is fetched and played only
 * once the hero is actually on screen, and never at all when the viewer has
 * asked for reduced motion. That matters here because every route sits behind
 * a 21+ gate, so an autoplaying source would pull the whole file down before
 * the visitor has confirmed anything.
 */
export function HeroFilm({ poster, src, label }: HeroFilmProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setActive(true);
        io.disconnect();
      },
      { rootMargin: "0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || !active) return;
    node.load();
    void node.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [active]);

  function toggle() {
    const node = ref.current;
    if (!node) return;
    if (node.paused) {
      void node.play().then(() => setPlaying(true));
    } else {
      node.pause();
      setPlaying(false);
    }
  }

  return (
    <>
      <video
        aria-label={label}
        className="signal-film"
        loop
        muted
        playsInline
        poster={poster}
        preload="none"
        ref={ref}
      >
        {active ? <source src={src} type="video/mp4" /> : null}
      </video>
      {active ? (
        <button className="signal-film-toggle" onClick={toggle} type="button">
          {playing ? "Pause film" : "Play film"}
        </button>
      ) : null}
    </>
  );
}
