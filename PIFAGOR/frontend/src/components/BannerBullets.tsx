import type { CSSProperties } from "react";
import { SUBJECT_BANNER_BULLETS } from "../data/site";

interface BannerBulletsProps {
  className?: string;
  style?: CSSProperties;
  items?: string[];
}

export function BannerBullets({ className, style, items }: BannerBulletsProps) {
  const bulletList = items ?? SUBJECT_BANNER_BULLETS;
  return (
    <ul
      className={`banner-bullets text-h1-futura${className ? ` ${className}` : ""}`}
      style={style}
    >
      {bulletList.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
