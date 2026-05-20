"use client";

import type { HTMLAttributes } from "react";

interface IslamicIconProps extends HTMLAttributes<SVGElement> {
  id: string;
  size?: number;
  title?: string;
}

export default function IslamicIcon({ id, size = 20, className, title, ...props }: IslamicIconProps) {
  const href = `/icons/islamic-sprite.svg#${id}`;

  return (
    <svg
      {...props}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? "img" : "img"}
      aria-hidden={title ? "false" : "true"}
    >
      {title ? <title>{title}</title> : null}
      <use href={href} xlinkHref={href} />
    </svg>
  );
}
