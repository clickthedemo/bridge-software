import "./promoted-slot.css";

/**
 * Marker for a slot a member would have paid for. Any placement that is bought
 * has to say so on the card itself - readers cannot judge a result they think
 * was earned when it was not.
 */
export function PromotedSlot() {
  return <span className="bridge-promoted">Promoted</span>;
}
