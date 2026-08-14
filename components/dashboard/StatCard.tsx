export function StatCard({
  label,
  value,
  sublabel,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: "neutral" | "valid" | "revoked" | "pending";
}) {
  const toneColor = {
    neutral: "var(--ink-700)",
    valid: "var(--signal-valid)",
    revoked: "var(--signal-revoked)",
    pending: "var(--signal-pending)",
  }[tone];

  return (
    <div
      className="p-5"
      style={{
        background: "var(--paper-50)",
        border: "1px solid var(--paper-200)",
        borderTop: `2px solid ${toneColor}`,
        borderRadius: "var(--radius-md)",
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--text-secondary-on-paper)" }}>
        {label}
      </div>
      <div className="mt-2 font-data text-3xl font-semibold" style={{ color: "var(--text-primary-on-paper)" }}>
        {value}
      </div>
      {sublabel && (
        <div className="mt-1 text-xs" style={{ color: "var(--text-secondary-on-paper)" }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
