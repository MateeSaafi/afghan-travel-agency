import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";

const Contact = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-amber-300/15 bg-surface px-6 py-14 text-center md:px-16 md:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-amber-400/10 via-transparent to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/2 h-56 w-136 -translate-x-1/2 rounded-full bg-orange-500/15 blur-3xl"
          />
          <div className="relative">
            <p className="flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              <span aria-hidden="true" className="font-display text-lg leading-none text-amber-400">
                05
              </span>
              <span aria-hidden="true" className="h-px w-8 bg-amber-300/20"></span>
              Get in touch
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-amber-50">
              Talk to a Real Person
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base/7 text-stone-300">
              Message us on WhatsApp and a member of our Kabul team will answer
              your questions directly — real people, real answers.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="https://wa.me/93785105088"
                target="_blank"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-b from-amber-400 to-orange-500 px-6 py-3 font-semibold text-stone-950 shadow-lg shadow-orange-950/40 transition hover:from-amber-300 hover:to-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:w-auto"
              >
                <MessageCircle className="size-4" /> Chat on WhatsApp
              </Link>
              <Link
                href="/packages?category=all"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700 bg-white/2 px-6 py-3 font-medium text-stone-200 transition hover:border-amber-300/40 hover:bg-stone-900/60 hover:text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:w-auto"
              >
                View Packages <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
