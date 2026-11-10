import { ICONS } from "@/lib/icons";

/** Union Jack, simplified SVG. Shown next to the "EN" language label (reference: header right). */
function UkFlag() {
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" className="h-3.5 w-6 rounded-[2px]" preserveAspectRatio="none">
      <clipPath id="uk-s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="uk-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#uk-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

/**
 * LanguageSelect — flag + "EN" + chevron. Static until i18n is added.
 */
export function LanguageSelect() {
  return (
    <button
      type="button"
      aria-label="Language: English"
      className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-caption font-semibold text-tcl-white hover:text-tcl-gold transition-colors cursor-pointer"
    >
      <UkFlag />
      EN
      <ICONS.ChevronRight aria-hidden="true" className="size-3 rotate-90" />
    </button>
  );
}
