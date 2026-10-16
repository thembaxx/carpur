export const NAV = [
  ["/marketplace", "New Cars"],
  ["/marketplace?inventory=sellers&condition=USED", "Used Cars"],
  ["/affordability", "Affordability"],
  ["/compare", "Compare"],
  ["/garage", "My Garage"],
] as const;

// Query order is irrelevant; additional filters or selections remove the highlight.
export function isActiveRoute(pathname: string, query: string, href: string) {
  const [targetPath, targetQuery = ""] = href.split("?");
  if (pathname !== targetPath) return false;
  const current = new URLSearchParams(query);
  const target = new URLSearchParams(targetQuery);
  current.sort();
  target.sort();
  return current.toString() === target.toString();
}
