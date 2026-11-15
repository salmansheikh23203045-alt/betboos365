/** Deposits may come from ANY mobile number; this field is optional. */
export const DEPOSIT_ANY_NUMBER_BN = "যেকোনো মোবাইল নম্বর থেকে ডিপোজিট করা যাবে।";

/** Empty, or a Bangladeshi mobile number in any common spelling. Mirrors the backend check. */
export function senderPhoneValid(v: string): boolean {
  const digits = v.replace(/[\s-]/g, "");
  return digits === "" || /^(?:\+?880|0)?1[3-9]\d{8}$/.test(digits);
}

export function SenderPhoneField({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const invalid = !senderPhoneValid(value);
  return (
    <div className="space-y-1">
      <label htmlFor="dep-sender" className={compact ? "text-[11px] font-semibold text-tcl-white" : "text-caption font-semibold text-tcl-white"}>
        Sending number <span className="font-normal text-tcl-muted">(optional)</span>
      </label>
      <input
        id="dep-sender"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="01XXXXXXXXX"
        maxLength={20}
        aria-invalid={invalid}
        className={
          (compact ? "h-9 text-xs " : "h-11 text-sm ") +
          "w-full rounded-md border bg-tcl-surface-2 px-3 font-mono text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none " +
          (invalid ? "border-tcl-red/60" : "border-tcl-border-muted")
        }
      />
      <p lang="bn" className="text-[11px] text-tcl-success">{DEPOSIT_ANY_NUMBER_BN}</p>
      {invalid ? <p className="text-[11px] text-tcl-red-bright">Enter a valid Bangladeshi mobile number, or leave it empty.</p> : null}
    </div>
  );
}
