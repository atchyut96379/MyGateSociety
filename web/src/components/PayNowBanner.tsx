import { Link } from "react-router-dom";

export function PayNowBanner({
  count,
  flatLabel,
}: {
  count: number;
  flatLabel?: string | null;
}) {
  if (count <= 0) return null;

  return (
    <Link to="/my-payments" className="card pay-now-banner pay-now-banner-link">
      <div>
        <h3 style={{ margin: "0 0 0.25rem", color: "var(--primary)" }}>
          Pay Now — maintenance pending
        </h3>
        <p className="muted" style={{ margin: 0 }}>
          {flatLabel ? `Flat ${flatLabel}: ` : ""}
          {count} unpaid bill{count > 1 ? "s" : ""}. Tap to pay now and get your receipt.
        </p>
      </div>
      <span className="pay-now-cta">Pay Now →</span>
    </Link>
  );
}
