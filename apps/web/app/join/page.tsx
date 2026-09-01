import { JoinForm } from "./join-form";

export default function JoinPage() {
  return (
    <section className="page shell form-page">
      <div className="page-heading">
        <p className="eyebrow">Step 1 of 4</p>
        <h1>How do you work in cannabis?</h1>
        <p className="lede">Your role shapes profile fields, verification requirements, and the dashboard experience.</p>
      </div>
      <JoinForm />
    </section>
  );
}
