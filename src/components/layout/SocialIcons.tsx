/* Official-style brand SVG icons for the footer social links.
 * Replaces the generic Lucide stand-ins (Play, Share2, Send, Camera, Music2).
 * Each icon is a simplified path that represents the recognisable brand mark.
 * Colours are inherited via currentColor so the button styling controls them. */

type IconProps = { className?: string };

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z" />
    </svg>
  );
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.6 8.2-1.8 8.7c-.1.6-.5.8-1 .5l-2.8-2-1.3 1.3c-.2.2-.3.3-.6.3l.2-2.8 5-4.5c.2-.2 0-.3-.3-.1L8.3 13.8l-2.7-.8c-.6-.2-.6-.6.1-.9l10.6-4.1c.5-.2.9.1.8.9l-.5.3Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.2c2.7 0 3 0 4.1.1 1 0 1.5.2 1.9.4.5.2.8.4 1.2.7.3.4.6.7.7 1.2.2.4.3 1 .4 1.9 0 1 .1 1.4.1 4.1s0 3-.1 4.1c0 1-.2 1.5-.4 1.9-.2.5-.4.8-.7 1.2-.4.3-.7.6-1.2.7-.4.2-1 .3-1.9.4-1 0-1.4.1-4.1.1s-3 0-4.1-.1c-1 0-1.5-.2-1.9-.4-.5-.2-.8-.4-1.2-.7-.3-.4-.6-.7-.7-1.2-.2-.4-.3-1-.4-1.9 0-1-.1-1.4-.1-4.1s0-3 .1-4.1c0-1 .2-1.5.4-1.9.2-.5.4-.8.7-1.2.4-.3.7-.6 1.2-.7.4-.2 1-.3 1.9-.4 1 0 1.4-.1 4.1-.1ZM12 0C9.3 0 8.9 0 7.9.1 6.8.1 6 .3 5.3.6c-.7.3-1.3.7-1.9 1.3S2.3 3.2 2 3.9c-.3.7-.5 1.5-.5 2.6C1.4 7.5 1.4 7.9 1.4 12c0 4.1 0 4.5.1 5.5 0 1.1.2 1.9.5 2.6.3.7.7 1.3 1.3 1.9s1.2 1 1.9 1.3c.7.3 1.5.5 2.6.5 1 .1 1.4.1 5.5.1 4.1 0 4.5 0 5.5-.1 1.1 0 1.9-.2 2.6-.5.7-.3 1.3-.7 1.9-1.3s1-1.2 1.3-1.9c.3-.7.5-1.5.5-2.6.1-1 .1-1.4.1-5.5 0-4.1 0-4.5-.1-5.5 0-1.1-.2-1.9-.5-2.6-.3-.7-.7-1.3-1.3-1.9S19.4.9 18.7.6C18 .3 17.2.1 16.1.1 15.1 0 14.7 0 12 0Z" />
      <path d="M12 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM18.4 5.6a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z" />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.3 5.4A4.5 4.5 0 0 1 16.2 2h-3.4v13.7a2.7 2.7 0 1 1-1.9-2.6V9.6a6.2 6.2 0 1 0 5.4 6.1V9.8a7.8 7.8 0 0 0 4.6 1.5V7.8a4.5 4.5 0 0 1-1.6-2.4Z" />
    </svg>
  );
}

/** Map of social link id → brand icon component. */
export const SOCIAL_ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  youtube: YouTubeIcon,
  facebook: FacebookIcon,
  telegram: TelegramIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
};

