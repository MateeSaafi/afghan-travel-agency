import { Shield, Lock, Check, MessageCircle, CreditCard, KeyRound } from "lucide-react";

const securityFeatures = [
  "End-to-end encryption for all communications",
  "Multi-factor authentication",
  "Real-time tracking and verification",
  "Secure payment escrow system",
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
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm font-medium">
              <Lock className="w-4 h-4" />
              Enterprise-Grade Security
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
              Your Security is Our Priority
            </h2>
            <p className="text-zinc-400 mb-8">
              Every booking is protected by our advanced security system,
              ensuring your personal information remains safe.
            </p>
            <div className="space-y-3">
              {securityFeatures.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                  <span className="text-zinc-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-[0_0_50px_rgba(251,146,60,0.06)]">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Trusted Services</span>
              </div>
              <div className="space-y-4">
                {trustedServices.map((service, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <service.icon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{service.title}</p>
                      <p className="text-xs text-zinc-500">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
