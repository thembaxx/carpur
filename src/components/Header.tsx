"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { NAV, isActiveRoute } from "@/lib/routes";

function Navigation() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, query]);
  return NAV.map(([href, label]) => {
    const active = isActiveRoute(pathname, query, href);
    return (
      <Link
        key={href}
        href={href}
        prefetch={false}
        className={active ? "on" : undefined}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  });
}

export function Header({ withActiveRoute = false }: { withActiveRoute?: boolean }) {
  return (
    <header>
      <Link className="logo" href="/">
        <Image
          src="/favicon.svg"
          width={30}
          height={30}
          alt=""
          aria-hidden="true"
          className="logo-mark"
          unoptimized
        />
        <span>Carpur<i>.</i></span>
      </Link>
      <nav id="nv" aria-label="Main navigation">
        {withActiveRoute ? (
          <Navigation />
        ) : (
          NAV.map(([href, label]) => (
            <Link key={href} href={href} prefetch={false}>
              {label}
            </Link>
          ))
        )}
      </nav>
      <Link className="btn o" href="/sign-in" prefetch={false}>
        Sign in
      </Link>
      <Link className="btn ac" href="/sell" prefetch={false}>
        Sell
      </Link>
    </header>
  );
}
