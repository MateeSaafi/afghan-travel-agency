import Link from "next/link";
import { ArrowRight } from "lucide-react";

const Hero: React.FC = () => {
  return (
    <section className="py-24 md:py-32 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,146,60,0.08),rgba(255,255,255,0))]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Trusted by 5,000+ customers
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight text-zinc-100">
            The Future of{" "}
            <span className="bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-200 text-transparent bg-clip-text">
              Travel Booking
            </span>
          </h1>
          <p className="text-lg text-zinc-400 mb-8 leading-relaxed max-w-2xl mx-auto">
            Join thousands who are already saving on travel costs through our
            secure online travel agency. Visa assistance, flight bookings, and scholarships made simple.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="packages?category=all"
              className="inline-flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-6 py-3 rounded-md font-medium transition-colors"
            >
              View Packages <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="https://api.whatsapp.com/send?phone=93785105088"
              target="_blank"
              className="inline-flex items-center justify-center border border-zinc-800 hover:bg-zinc-800/50 px-6 py-3 rounded-md font-medium transition-colors text-zinc-300"
            >
              Contact Us
            </Link>
          </div>
          <div className="mt-16 pt-10 border-t border-zinc-800/50 grid grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-zinc-100 mb-1">5k+</div>
              <div className="text-sm text-zinc-500">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-zinc-100 mb-1">$200K+</div>
              <div className="text-sm text-zinc-500">Saved for Clients</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-zinc-100 mb-1">99.9%</div>
              <div className="text-sm text-zinc-500">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
