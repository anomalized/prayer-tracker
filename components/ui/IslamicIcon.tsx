"use client";

import type { HTMLAttributes } from "react";

interface IslamicIconProps extends HTMLAttributes<SVGElement> {
  id: string;
  size?: number;
  title?: string;
  active?: boolean;
}

export default function IslamicIcon({ id, size = 20, className, title, active = false, ...props }: IslamicIconProps) {
  const symbolId = `${id}${active ? "-filled" : ""}`;
  const href = `/icons/islamic-sprite.svg#${symbolId}`;

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
