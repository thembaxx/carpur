"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useReveal } from "@/hooks/useReveal";

interface Props { title: string; description: string; action: string; href: string; reveal?: boolean; style?: CSSProperties }

export function EmptyState({ title, description, action, href, reveal = false, style }: Props) {
  const ref = useReveal<HTMLDivElement>(reveal);
  return (
    <div ref={ref} className={`empty${reveal ? " rv" : ""}`} style={style} role="status">
      <b>{title}</b>
      <p className="mut" style={{ margin: "6px 0 16px" }}>{description}</p>
      <Link className="btn" href={href} prefetch={false}>{action}</Link>
    </div>
  );
}
