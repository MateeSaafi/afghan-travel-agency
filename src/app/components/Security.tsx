import { Shield, Check, MessageCircle, CreditCard, KeyRound } from "lucide-react";

const securityFeatures = [
  "End-to-end encrypted WhatsApp support",
  "Secure account sign-in with Firebase Authentication",
  "Track your appointments from your account",
  "Card payments processed by Stripe",
];

const trustedServices = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Secure communication channel",
  },
  {
    icon: CreditCard,
    title: "Stripe",
    description: "Trusted payment processing",
  },
  {
    icon: KeyRound,
    title: "Firebase",
    description: "Secure authentication",
  },
];

const Security = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2 lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              <span aria-hidden="true" className="font-display text-lg leading-none text-amber-400">
                03
              </span>
              <span aria-hidden="true" className="h-px w-8 bg-amber-300/20"></span>
              Security &amp; trust
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-amber-50">
              Your Trust, Protected
            </h2>
            <p className="mt-4 text-base/7 text-stone-400">
              Every booking and every conversation is protected — your
              documents and personal details stay between you and our team.
            </p>
            <div className="mt-8 space-y-4">
              {securityFeatures.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10">
                    <Check className="size-3 text-emerald-400" />
                  </div>
                  <span className="text-sm/6 text-stone-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/5 bg-surface p-6 md:p-8 shadow-ember-lg md:order-first">
            <div className="mb-6 flex items-center gap-2">
              <Shield className="size-5 text-amber-400" />
              <span className="text-sm font-medium text-stone-200">
                Trusted services we build on
              </span>
            </div>
            <div className="space-y-4">
              {trustedServices.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-2xl border border-white/5 bg-surface-2/70 p-4"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-300/15 bg-amber-400/10">
                    <service.icon className="size-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-50">{service.title}</p>
                    <p className="text-xs text-stone-400">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
