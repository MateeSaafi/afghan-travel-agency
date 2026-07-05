import { MapPin } from "lucide-react";

const About = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              <span aria-hidden="true" className="font-display text-lg leading-none text-amber-400">
                04
              </span>
              <span aria-hidden="true" className="h-px w-8 bg-amber-300/20"></span>
              Rooted in Kabul
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-amber-50">
              Over a Decade of Excellence
            </h2>
            <p className="mt-4 text-base/7 text-stone-400">
              At Afghan Travel Agency, with over a decade of experience,
              we&apos;re dedicated to simplifying your travel dreams. We offer
              reliable visa assistance, the lowest ticket prices, and exclusive
              scholarships to Europe. Plus, our full refund policy ensures your
              journey is stress-free.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-4 py-2 text-sm text-stone-300">
              <MapPin className="size-4 text-amber-400" />
              Find our office on the map
            </div>
          </div>
          <div className="relative rounded-3xl border border-white/5 bg-surface p-2 shadow-ember">
            <iframe
              className="h-72 w-full rounded-2xl md:h-80"
              title="Afghan Travel Agency on Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6195.005197441329!2d69.16665547540066!3d34.5368208138608!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38d16f0e31e7063f%3A0xa9325fbf8366059d!2zQWZnaGFuIFRyYXZlbCBBZ2VuY3kgLSDYtNix2qnYqiDYs9uM2KfYrdiq24wg2KfZgdi62KfZhg!5e0!3m2!1sen!2s!4v1698301029086!5m2!1sen!2s"
              loading="lazy"
            ></iframe>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-5 top-5 rounded-full bg-night/80 px-3 py-1 text-xs font-medium text-amber-100 backdrop-blur-sm"
            >
              Kabul, Afghanistan
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
