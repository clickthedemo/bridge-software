"use client";

import { useEffect, useRef, useState } from "react";
import "./bridge-intro.css";

/*
 * The 3.25s scrapbook cold open that runs before the 21+ gate.
 *
 * The wordmark cycles through fourteen treatments at speed while torn paper, tape,
 * stamps, doodles and a guitar slam in around it. It is the Field Notes
 * companion's visual language, which the client already reacted to, pushed
 * harder and made the front door.
 *
 * Two rules it must not break: it is skippable at any time by anyone, and it
 * does not run at all under prefers-reduced-motion. It is decoration in front
 * of a legal gate, so it can never be the thing standing between a person and
 * that gate.
 */

/* 5s total: 3.4s of treatments, then the smoke gathers into the mark. */
const RUN_MS = 5000;
const GATHER_AT_MS = 3400;
const TREATMENT_MS = 210;
const TREATMENTS = 14;
const WORD = "BRIDGE";

export function BridgeIntro({ onDone }: { onDone: () => void }) {
  /* Each letter flips independently, the way the companion's wordmark does.
     One shared index made the whole word go dark at once and read as broken. */
  const [letters, setLetters] = useState<number[]>(() => WORD.split("").map((_, i) => i % TREATMENTS));
  const [resolved, setResolved] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gathering, setGathering] = useState(false);
  const doneRef = useRef(false);
  const skipRef = useRef<HTMLButtonElement>(null);

  /* One exit path, however it is reached, so a skip and a timeout cannot both fire. */
  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    window.setTimeout(onDone, 320);
  }

  useEffect(() => {
    skipRef.current?.focus();

    let tick = 0;
    const cycle = window.setInterval(() => {
      tick += 1;
      setLetters((current) =>
        current.map((value, i) =>
          /* Stagger which letter turns on each tick so they never move as a
             block, and only ever a couple at a time. */
          (tick + i) % 3 === 0 ? (value + 1 + i) % TREATMENTS : value,
        ),
      );
    }, TREATMENT_MS);
    /* Stop cycling when the wordmark starts dissolving, so the last frame
       does not flick to a new treatment mid-gather. */
    /* The word lands clean before the smoke takes over, like the companion's
       intro resolving to solid white. */
    const settle = window.setTimeout(() => {
      window.clearInterval(cycle);
      setResolved(true);
    }, GATHER_AT_MS - 700);
    const hold = window.setTimeout(() => setGathering(true), GATHER_AT_MS);
    const end = window.setTimeout(finish, RUN_MS);

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") finish();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(settle);
      window.clearTimeout(hold);
      window.clearTimeout(end);
      window.removeEventListener("keydown", onKey);
    };
    // finish and onDone are stable for the life of the intro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-label="Bridge intro animation"
      className="bridge-intro"
      data-gathering={gathering || undefined}
      data-leaving={leaving || undefined}
      onClick={finish}
      role="presentation"
    >
      {/* Shot smoke, rising the full height and resolving into the arch mark
          on its last beat. Muted, inert and decorative. */}
      <video
        aria-hidden="true"
        autoPlay
        className="bi-film"
        loop={false}
        muted
        playsInline
        poster="/intro/smoke-rise-poster.webp"
        preload="auto"
      >
        <source src="/intro/smoke-rise.mp4" type="video/mp4" />
      </video>

      <div className="bridge-intro-grain" aria-hidden="true" />

      {/* Paper, tape and stamps land on beats rather than drifting in. */}
      <img alt="" aria-hidden="true" className="bi-ephemera bi-tape-a" src="/intro/ephemera.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-tape-b" src="/intro/ephemera.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-leaf-a" src="/intro/leaf-doodles.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-leaf-b" src="/intro/leaf-doodles.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-arrow" src="/intro/arrows.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-stamp" src="/intro/stamp-1.webp" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-smoke-back" src="/intro/smoke-motif.svg" />
      <img alt="" aria-hidden="true" className="bi-ephemera bi-smoke" src="/intro/smoke-motif.svg" />

      {/* The guitar runs corner to corner behind the wordmark. */}
      <svg aria-hidden="true" className="bi-guitar" viewBox="0 0 620 190">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="6">
          <path d="M108 95c0-34 26-58 62-58 24 0 38 12 52 12s24-10 44-10c30 0 50 22 50 56s-20 56-50 56c-20 0-30-10-44-10s-28 12-52 12c-36 0-62-24-62-58z" />
          <path d="M316 95h150" />
          <path d="M466 74h44a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10h-44z" />
          <circle cx="196" cy="95" r="26" />
          <path d="M258 78v34M276 74v42" />
          <path d="M476 82h34M476 95h34M476 108h34" strokeWidth="3" />
        </g>
      </svg>

      <div className="bi-stage">
        <span className="bi-kicker">Est. for the industry that gets shut out</span>
        <h1 className="bi-word" data-resolved={resolved || undefined}>
          {WORD.split("").map((letter, index) => (
            <span
              className="bi-letter"
              data-t={resolved ? undefined : letters[index]}
              key={`${letter}-${index}`}
              style={{ animationDelay: `${index * 14}ms` }}
            >
              {letter}
            </span>
          ))}
        </h1>
        <span className="bi-underline" aria-hidden="true" />
        <span className="bi-hand">one industry, one network</span>
      </div>

      <button className="bi-skip" onClick={finish} ref={skipRef} type="button">
        Skip
      </button>
    </div>
  );
}
