"use client";

import Link from "next/link";
import { createElement, type HTMLAttributes, type Ref } from "react";
import { useReveal } from "@/hooks/useReveal";

type Props = HTMLAttributes<HTMLElement> & (
  { as: "a"; href: string } | { as?: "p" | "h2" | "div" | "section"; href?: never }
);

/** Adds reveal behavior to the reference element itself, without an extra wrapper. */
export function Reveal({ as = "div", className = "", children, href, ...props }: Props) {
  const ref = useReveal<HTMLElement>();
  const classes = `${className}${className ? " " : ""}rv`;
  if (as === "a" && href) return createElement(Link, { ...props, href, prefetch: false, className: classes, ref: ref as Ref<HTMLAnchorElement> }, children);
  return createElement(as, { ...props, className: classes, ref }, children);
}
