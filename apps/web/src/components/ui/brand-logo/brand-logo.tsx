import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGOS = {
  wordmark: {
    src: "/VEO_Logotipo_Oscuro_Original.png",
    width: 306,
    height: 63,
    className: "h-6 w-auto",
  },
  isotipo: {
    src: "/FAVICON_VEO_Isotipo_Lima.png",
    width: 1107,
    height: 579,
    className: "h-4 w-auto",
  },
} as const;

const THEMED_WORDMARK_CLASS =
  "invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0";

type BrandLogoProps = {
  /** The wordmark ships white-on-transparent, so it is inverted on light themes. */
  variant?: keyof typeof LOGOS;
  /** Keeps the wordmark white regardless of theme, for dark surfaces. */
  onDark?: boolean;
  className?: string;
  priority?: boolean;
};

function BrandLogo({
  variant = "wordmark",
  onDark = false,
  className,
  priority,
}: BrandLogoProps) {
  const logo = LOGOS[variant];
  return (
    <Image
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt="VEO"
      priority={priority}
      className={cn(
        "select-none",
        logo.className,
        variant === "wordmark" && !onDark && THEMED_WORDMARK_CLASS,
        className,
      )}
    />
  );
}

export { BrandLogo };
export type { BrandLogoProps };
