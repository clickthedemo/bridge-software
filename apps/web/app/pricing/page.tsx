import Link from "next/link";

const concepts = [
  {
    name: "Community",
    price: "$0",
    note: "Public adults 21+",
    description: "Follow public safe cannabis news, events, product launches, and dispensary information.",
    features: ["Public Community News", "Dispensary discovery", "Public profiles", "Menu and direction links"],
  },
  {
    name: "Founding Business",
    price: "$349",
    note: "per month after the founding pilot",
    description: "The working concept discussed in Tori’s review for verified cannabis businesses and professional members.",
    features: ["First six months proposed free", "Payment method collected at activation", "Verified business profile", "Targeted promotions", "Protected B2B access", "Founding rate eligibility"],
    featured: true,
  },
  {
    name: "Multi Market",
    price: "Custom",
    note: "for expanded teams and markets",
    description: "A concept for operators managing multiple organizations, locations, territories, or state markets.",
    features: ["Multiple locations", "Delegated staff roles", "Market and territory controls", "Expanded reporting", "Implementation support"],
  },
];

export default function PricingPage() {
  return (
    <section className="page shell pricing-page">
      <div className="page-heading">
        <p className="eyebrow">Pricing concept for Tori</p>
        <h1>A useful network before it becomes another expensive system</h1>
        <p className="lede">These tiers translate the meeting discussion into something reviewable. Billing is not connected, and no pricing is final until Tori approves the offer, term, and founding member rules.</p>
      </div>
      <div className="pricing-grid">
        {concepts.map((concept) => (
          <article className={concept.featured ? "pricing-plan featured" : "pricing-plan"} key={concept.name}>
            <p className="eyebrow">{concept.name}</p>
            <div className="price-line"><strong>{concept.price}</strong><span>{concept.note}</span></div>
            <p>{concept.description}</p>
            <ul>{concept.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <Link className={concept.featured ? "button primary full" : "button secondary full"} href="/join">Choose this concept</Link>
          </article>
        ))}
      </div>
      <section className="decision-panel">
        <p className="eyebrow">Tori’s input required</p>
        <h2>Lock the founding offer before payment work begins</h2>
        <ol>
          <li>Confirm whether the first six months are free for every founding business or only qualified pilot members.</li>
          <li>Confirm the required agreement length and when a payment method is collected.</li>
          <li>Confirm whether $349 is the permanent founding rate and what causes future pricing to increase.</li>
          <li>Define what Community members, single businesses, and multi market operators receive.</li>
        </ol>
      </section>
    </section>
  );
}
