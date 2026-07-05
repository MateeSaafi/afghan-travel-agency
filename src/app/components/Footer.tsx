import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  {
    title: "Services",
    links: [
      { label: "Visa Assistance", href: "/packages?category=visa" },
      { label: "Flight Booking", href: "/packages?category=ticket" },
      { label: "Scholarships", href: "/packages?category=scholarship" },
      { label: "Asylum", href: "/packages?category=asylum" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "https://wa.me/93785105088" },
      { label: "Packages", href: "/packages?category=all" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-white/5 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              <Image
                src="/logo.png"
                alt="logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="font-display text-lg text-amber-50">
                Afghan Travel Agency
              </span>
            </Link>
            <p className="mt-4 text-sm/6 text-stone-400">
              Your trusted partner for visa assistance, flight bookings, and educational opportunities abroad.
            </p>
          </div>
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-300">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link, lIndex) => (
                  <li key={lIndex}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-sm text-stone-400 transition-colors hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-sm text-stone-400">
            © 2026 Afghan Travel Agency. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="rounded-sm text-sm text-stone-400 transition-colors hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="rounded-sm text-sm text-stone-400 transition-colors hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
      {/* Full-bleed ghost wordmark: spans the whole viewport (breaks out of
          the max-w-7xl content box) and is sized to that full width via a
          container query, so it fills edge-to-edge without ever clipping */}
      <div className="mt-10 overflow-hidden @container" aria-hidden="true">
        <p className="font-display -mb-3 select-none whitespace-nowrap text-center text-[11.5cqw] leading-none text-amber-50/3">
          AFGHAN TRAVEL AGENCY
        </p>
      </div>
    </footer>
  );
};

export default Footer;
