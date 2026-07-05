import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

const stats = [
  { value: "10+", label: "Years in Kabul" },
  { value: "5,000+", label: "Travellers served" },
  { value: "24/7", label: "WhatsApp support" },
];

const Hero: React.FC = () => {
  return (
    <section className="relative isolate flex min-h-[88svh] items-center overflow-hidden bg-night">
      <Image
        src="/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_center] md:object-[72%_center]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden md:block bg-linear-to-r from-night from-15% via-night/60 via-45% to-transparent to-70%"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 md:hidden bg-linear-to-b from-night/90 via-night/50 to-night/75"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 md:h-40 bg-linear-to-t from-night to-transparent"
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 md:py-32">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-night/60 px-4 py-1.5 text-sm text-amber-100/90 backdrop-blur">
            <span className="size-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
            Serving Afghan travellers for over a decade
          </div>
          <h1 className="font-display mt-6 text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-wide text-amber-50">
            FROM KABUL,
            <br />
            <span className="bg-linear-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              TO THE WORLD.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg/8 text-stone-300">
            Visa assistance, flight tickets, scholarships abroad, and migration
            support — guided step by step by a team Afghan families have trusted
            for over a decade.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/packages?category=all"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-b from-amber-400 to-orange-500 px-6 py-3 font-semibold text-stone-950 shadow-lg shadow-orange-950/40 transition hover:from-amber-300 hover:to-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              View Packages <ArrowRight className="size-4" />
            </Link>
            <Link
              href="https://api.whatsapp.com/send?phone=93785105088"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-night/40 backdrop-blur px-6 py-3 font-medium text-stone-200 transition hover:border-amber-300/40 hover:bg-stone-900/60 hover:text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              <MessageCircle className="size-4" /> Chat on WhatsApp
            </Link>
          </div>
          <div className="mt-14 grid max-w-lg grid-cols-3 gap-4 sm:gap-6 border-t border-white/10 pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-amber-50">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-stone-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
