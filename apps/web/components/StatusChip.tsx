export function StatusChip({ verified }: { verified: boolean }) {
  return (
    <span className={verified ? "status-chip verified" : "status-chip pending"}>
      <span aria-hidden="true">{verified ? "✓" : "•"}</span>
      {verified ? "Verified" : "Pending review"}
    </span>
  );
}
