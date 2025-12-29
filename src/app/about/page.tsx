import Footer from "../components/Footer";
import { Building2, MapPin, Globe, Shield, Heart } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Local Expertise",
    description: "Over a decade of experience navigating travel requirements for multiple countries.",
  },
  {
    icon: Shield,
    title: "Safe & Reliable",
    description: "Your safety is our top priority, with secure processes and trusted partners.",
  },
  {
    icon: Heart,
    title: "Personalized Service",
    description: "Tailored solutions to suit your specific needs and budget.",
  },
];

const About = () => {
  return (
    <>
      <main className="pt-24 pb-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,146,60,0.06),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Hero Section */}
          <section className="mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm font-medium">
                  <Building2 className="w-4 h-4" />
                  About Us
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">
                  Your Trusted Travel Partner
                </h1>
                <p className="text-zinc-400 leading-relaxed mb-6">
                  At Afghan Travel Agency, with over a decade of experience,
                  we&apos;re dedicated to simplifying your travel dreams. We offer
                  reliable visa assistance, the lowest ticket prices, and
                  exclusive scholarships to Europe.
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  Our full refund policy ensures your journey is stress-free, and our
                  team of experts is here to guide you every step of the way.
                </p>
              </div>
              <div className="relative">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 overflow-hidden shadow-[0_0_50px_rgba(251,146,60,0.06)]">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-400">Our Location</span>
                  </div>
                  <iframe
                    className="w-full h-72"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6195.005197441329!2d69.16665547540066!3d34.5368208138608!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38d16f0e31e7063f%3A0xa9325fbf8366059d!2zQWZnaGFuIFRyYXZlbCBBZ2VuY3kgLSDYtNix2qnYqiDYs9uM2KfYrdiq24wg2KfZgdi62KfZhg!5e0!3m2!1sen!2s!4v1698301029086!5m2!1sen!2s"
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
                Why Choose Us?
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                We combine local expertise with global connections to provide you with the best travel experience.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center hover:border-orange-500/20 hover:shadow-[0_0_30px_rgba(251,146,60,0.08)] transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 mb-4">
                    <feature.icon className="w-6 h-6 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default About;
