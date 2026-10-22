import Link from "next/link";

export default function NotFound() {
  return (
    <section className="empty" style={{ marginTop: 40 }}>
      <h2>Page not found</h2>
      <p style={{ marginTop: 16 }}>
        <Link className="btn" href="/">
          Back home
        </Link>
      </p>
    </section>
  );
}
