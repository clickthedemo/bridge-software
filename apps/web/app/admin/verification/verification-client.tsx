"use client";

import { useState } from "react";

// Fictional sample queue for the discovery prototype.
type QueueItem = {
  name: string;
  role: string;
  market: string;
  status: string;
  waitingDays: number;
};

const queue: QueueItem[] = [
  { name: "Northstar Sales Group", role: "Sales rep", market: "Illinois", status: "EIN received", waitingDays: 1 },
  { name: "Union Street Collective", role: "Dispensary", market: "Massachusetts", status: "License mismatch", waitingDays: 2 },
  { name: "Sunroom Wellness", role: "Brand", market: "New York", status: "Ready for review", waitingDays: 3 },
  { name: "Coastal Buyers Co.", role: "Retailer", market: "California", status: "Documents missing", waitingDays: 4 },
];

const needsAttention = (status: string) => status.includes("mismatch") || status.includes("missing");

export function VerificationQueue() {
  const [oldestFirst, setOldestFirst] = useState(false);

  const rows = [...queue].sort((a, b) =>
    oldestFirst ? b.waitingDays - a.waitingDays : a.waitingDays - b.waitingDays,
  );

  return (
    <div className="content-card table-card">
      <div className="result-bar">
        <strong>Applications</strong>
        <button
          aria-pressed={oldestFirst}
          className="text-button"
          onClick={() => setOldestFirst((value) => !value)}
          type="button"
        >
          {oldestFirst ? "Sorted oldest first" : "Sort oldest first"}
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Organization</th><th>Type</th><th>Market</th><th>Status</th><th>Waiting</th>
              <th><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.name}>
                <td><strong>{item.name}</strong></td>
                <td>{item.role}</td>
                <td>{item.market}</td>
                <td>
                  <span className={needsAttention(item.status) ? "status-chip warning" : "status-chip pending"}>
                    {item.status}
                  </span>
                </td>
                <td>{item.waitingDays === 1 ? "1 day" : `${item.waitingDays} days`}</td>
                <td>
                  <button disabled title="Detail review opens in the post-decision build" type="button">Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="form-hint table-hint">
        Fictional sample queue. Detail review with evidence, decision reasons, and confirmation opens in the
        post-decision build.
      </p>
    </div>
  );
}
