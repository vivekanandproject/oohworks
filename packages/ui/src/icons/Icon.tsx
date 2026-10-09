import { ICON_PATHS, type IconName } from "./paths";

export type { IconName };

export interface IconProps {
  name: IconName;
  /** 20 inline with text, 24 in cards. Never below 16. */
  size?: 16 | 20 | 24 | 32;
  title?: string;
  className?: string;
}

/** Single-ink outline icon from the design system. Colour comes from the surrounding text. */
export function Icon({ name, size = 20, title, className }: IconProps) {
  const markup = ICON_PATHS[name].join("");
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : "") + markup }}
    />
  );
}
