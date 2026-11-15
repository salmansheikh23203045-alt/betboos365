export const PROMO_TEXT =
  "WELCOME TO BetBoos365, A PLACE WHERE THRILLING EXPERIENCES AND EVERYDAY ENJOYMENT COME TOGETHER AND TAKE PLEASURE IN THE ACTION AS YOU SEE IT!!";

export function PromoMarquee({ text = PROMO_TEXT }: { text?: string }) {
  return (
    <div className="hidden h-7 items-center overflow-hidden bg-tcl-gold lg:flex">
      <div className="marquee-track">
        <p className="shrink-0 whitespace-nowrap px-8 text-[11px] font-extrabold uppercase tracking-wide text-tcl-black">
          {text}
        </p>
        <p className="shrink-0 whitespace-nowrap px-8 text-[11px] font-extrabold uppercase tracking-wide text-tcl-black" aria-hidden="true">
          {text}
        </p>
        <p className="shrink-0 whitespace-nowrap px-8 text-[11px] font-extrabold uppercase tracking-wide text-tcl-black" aria-hidden="true">
          {text}
        </p>
      </div>
    </div>
  );
}
