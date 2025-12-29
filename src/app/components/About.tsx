import { MapPin, Building2 } from "lucide-react";

const About = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm font-medium">
              <Building2 className="w-4 h-4" />
              About Us
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
              Over a Decade of Excellence
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              At Afghan Travel Agency, with over a decade of experience,
              we&apos;re dedicated to simplifying your travel dreams. We offer
              reliable visa assistance, the lowest ticket prices, and exclusive
              scholarships to Europe. Plus, our full refund policy ensures your
              journey is stress-free.
            </p>
            <div className="flex items-center gap-2 text-zinc-300">
              <MapPin className="w-4 h-4 text-zinc-500" />
              <span className="text-sm">Find our location on the map</span>
            </div>
          </div>
          <div className="relative">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 overflow-hidden shadow-[0_0_50px_rgba(251,146,60,0.06)]">
              <iframe
                className="rounded-md w-full h-72"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6195.005197441329!2d69.16665547540066!3d34.5368208138608!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38d16f0e31e7063f%3A0xa9325fbf8366059d!2zQWZnaGFuIFRyYXZlbCBBZ2VuY3kgLSDYtNix2qnYqiDYs9uM2KfYrdiq24wg2KfZgdi62KfZhg!5e0!3m2!1sen!2s!4v1698301029086!5m2!1sen!2s"
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
