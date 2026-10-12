import { ScrollSpin } from "@/components/ScrollSpin";

export const metadata = { title: "ScrollSpin · Bridge design system" };

export default function ScrollSpinDemoPage() {
  return (
    <section className="page">
      <div className="shell page-heading">
        <p className="eyebrow">Motion component</p>
        <h1>ScrollSpin</h1>
        <p className="lede">
          A 73-frame turnaround scrubbed by scroll position. Keep scrolling — the figure keeps
          turning on its own between scrolls, and holds a reduced-motion still frame instead.
        </p>
      </div>
      <ScrollSpin frameDir="/bridge-spin" frameCount={73} alt="Bridge mascot turnaround" />
      <div className="shell page-heading">
        <p className="lede">End of the scrub. The sticky stage releases here.</p>
      </div>
    </section>
  );
}
