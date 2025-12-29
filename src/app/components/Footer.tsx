import { Bebas_Neue } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ["400"] });

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
    <footer className="border-t border-zinc-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className={`${bebasNeue.className} text-lg text-zinc-100`}>
                Afghan Travel Agency
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Your trusted partner for visa assistance, flight bookings, and educational opportunities abroad.
            </p>
          </div>
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h4 className="text-sm font-semibold text-zinc-300 mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, lIndex) => (
                  <li key={lIndex}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-zinc-500">
            © 2025 Afghan Travel Agency. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
