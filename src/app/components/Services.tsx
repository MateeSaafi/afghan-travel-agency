import Link from "next/link";
import {
  ArrowRight,
  FileCheck2,
  GraduationCap,
  Plane,
  ShieldCheck,
} from "lucide-react";

const services = [
  {
    title: "Visa Assistance",
    description: "We offer visa assistance for many countries, including Pakistan, Iran, Qatar and more. Expert guidance through the entire application process.",
    icon: FileCheck2,
    href: "/packages?category=visa",
    label: "View Visa Packages",
  },
  {
    title: "Scholarships",
    description: "Scholarships for England, Scotland, Belarus and more. Our team of professional consultants will help you on every step of your journey.",
    icon: GraduationCap,
    href: "/packages?category=scholarship",
    label: "View Scholarships",
  },
  {
    title: "Flight Booking",
    description: "We specialize in providing the lowest-rate tickets for both national and international flights, ensuring affordable travel options.",
    icon: Plane,
    href: "/packages?category=ticket",
    label: "View Tickets",
  },
  {
    title: "Asylum Services",
    description: "We offer asylum packages to various countries with favorable conditions. Secure payment options with flexible arrangements.",
    icon: ShieldCheck,
    href: "/packages?category=asylum",
    label: "View Asylum Packages",
  },
];

const Services = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 md:mb-14 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              <span aria-hidden="true" className="font-display text-lg leading-none text-amber-400">
                02
              </span>
              <span aria-hidden="true" className="h-px w-8 bg-amber-300/20"></span>
              What we offer
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-amber-50">
              Four Ways We Can Help
            </h2>
          </div>
          <p className="max-w-sm text-sm/6 text-stone-400">
            Every service is handled in person by our Kabul team — from first
            consultation to final documents.
          </p>
        </div>
        <ul className="border-y border-white/5">
          {services.map((service, index) => (
            <li key={index} className="border-b border-white/5 last:border-b-0">
              <Link
                href={service.href}
                className="group flex items-start gap-4 sm:gap-6 rounded-sm py-6 sm:py-7 transition-colors hover:bg-white/2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                <span
                  aria-hidden="true"
                  className="font-display hidden w-14 shrink-0 pt-1 text-5xl leading-none text-amber-50/10 transition-colors group-hover:text-amber-400/40 sm:block"
                >
                  0{index + 1}
                </span>
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/15 bg-linear-to-br from-amber-400/15 to-orange-600/5">
                  <service.icon className="size-5 text-amber-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold text-amber-50">
                    {service.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm/6 text-stone-400">
                    {service.description}
                  </p>
                  <span className="sr-only lg:hidden">{service.label}</span>
                </div>
                <span className="mt-1 hidden shrink-0 items-center gap-2 text-sm font-medium text-amber-300 transition-colors group-hover:text-amber-200 lg:inline-flex">
                  {service.label}
                  <ArrowRight className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-1.5 size-4 shrink-0 text-stone-500 lg:hidden"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Services;
