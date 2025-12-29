import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";

const services = [
  {
    title: "Visa Assistance",
    description: "We offer visa assistance for many countries, including Pakistan, Iran, Qatar and more. Expert guidance through the entire application process.",
    image: "/visa.png",
    href: "packages?category=visa",
    label: "View Visa Packages",
  },
  {
    title: "Scholarships",
    description: "Scholarships for England, Scotland, Belarus and more. Our team of professional consultants will help you on every step of your journey.",
    image: "/scholarship.png",
    href: "packages?category=scholarship",
    label: "View Scholarships",
  },
  {
    title: "Flight Booking",
    description: "We specialize in providing the lowest-rate tickets for both national and international flights, ensuring affordable travel options.",
    image: "/ticket.png",
    href: "packages?category=ticket",
    label: "View Tickets",
  },
  {
    title: "Asylum Services",
    description: "We offer asylum packages to various countries with favorable conditions. Secure payment options with flexible arrangements.",
    image: "/immigration.png",
    href: "packages?category=asylum",
    label: "View Asylum Packages",
  },
];

const Services = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm font-medium">
            <Briefcase className="w-4 h-4" />
            What We Offer
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
            Our Services
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-orange-500/20 hover:shadow-[0_0_30px_rgba(251,146,60,0.08)] transition-all duration-300"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Image
                    width={40}
                    height={40}
                    src={service.image}
                    alt={service.title}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    {service.description}
                  </p>
                  <Link
                    href={service.href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-orange-300 transition-colors"
                  >
                    {service.label}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
