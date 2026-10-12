import { GetListedBand } from "@/components/GetListedBand";

export const metadata = { title: "Get listed band · Bridge design system" };

export default function GetListedBandDemoPage() {
  return (
    <section className="page shell">
      <div className="page-heading">
        <p className="eyebrow">Marketing component</p>
        <h1>Get listed band</h1>
        <p className="lede">
          The seller-side counterpart to Explore&rsquo;s buyer-side search. It stacks on phones
          with a full-width call to action and splits into copy plus a right-aligned action from
          860px up.
        </p>
      </div>
      <GetListedBand />
    </section>
  );
}
