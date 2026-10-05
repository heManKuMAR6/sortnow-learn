import Link from "next/link";

/** A required, unticked agreement box that shows the exact words the person is agreeing to. */
export function ConsentCheck({
  checked,
  onChange,
  text,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  text: string;
}) {
  return (
    <label className="flex items-start gap-2 text-xs text-secondary">
      <input type="checkbox" className="mt-0.5 shrink-0" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
      <span>
        {text}{" "}
        <Link href="/privacy" target="_blank" className="text-link" data-track="consent-privacy">
          Privacy notice
        </Link>
        .
      </span>
    </label>
  );
}
