import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";

const Contact = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 md:p-12 text-center shadow-[0_0_60px_rgba(251,146,60,0.06)]">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm font-medium">
            <MessageCircle className="w-4 h-4" />
            Get in Touch
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
            Have an Inquiry?
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
            If you have a general inquiry and would like to speak to our team, you
            can contact us via WhatsApp. Or browse our packages to find what you need.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="https://wa.me/93785105088"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:bg-zinc-800 px-6 py-3 rounded-md font-medium transition-colors text-zinc-300"
            >
              Contact via WhatsApp
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="packages?category=all"
              className="inline-flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-6 py-3 rounded-md font-medium transition-colors"
            >
              View Packages
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
