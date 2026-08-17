type BadgeTone = "success" | "warning" | "danger" | "neutral" | "brand";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-status-successBg text-status-success",
  warning: "bg-status-warningBg text-status-warning",
  danger: "bg-status-dangerBg text-status-danger",
  neutral: "bg-status-neutralBg text-status-neutral",
  brand: "bg-brand-100 text-brand-700",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
