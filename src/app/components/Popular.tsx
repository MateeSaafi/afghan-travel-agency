import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import PackageImage from "./PackageImage";

type Item = {
  id: string;
  name: string;
  headline: string;
  image: string;
};

async function getPopularItems() {
  try {
    const appointmentsSnapshot = await getDocs(collection(db, "appointments"));
    const appointmentsCounts: Record<string, number> = {};

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const itemId = data.itemId;
      if (itemId) {
        appointmentsCounts[itemId] = (appointmentsCounts[itemId] || 0) + 1;
      }
    });

    const topItemIds = Object.entries(appointmentsCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([itemId]) => itemId);

    const itemsSnapshot = await getDocs(query(collection(db, "items")));
    const items: Item[] = [];

    itemsSnapshot.forEach((doc) => {
      if (topItemIds.includes(doc.id)) {
        items.push({ id: doc.id, ...(doc.data() as Omit<Item, "id">) });
      }
    });

    return items.sort(
      (a, b) => (appointmentsCounts[b.id] || 0) - (appointmentsCounts[a.id] || 0)
    );
  } catch (error) {
    console.error("Failed to load popular items:", error);
    return [];
  }
}

export default async function Popular() {
  const items = await getPopularItems();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">
              <span aria-hidden="true" className="font-display text-lg leading-none text-amber-400">
                01
              </span>
              <span aria-hidden="true" className="h-px w-8 bg-amber-300/20"></span>
              Most requested
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-amber-50">
              Popular Packages
            </h2>
          </div>
          <Link
            href="/packages?category=all"
            className="group inline-flex items-center gap-2 rounded-sm text-sm font-medium text-amber-300 transition-colors hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
          >
            View all packages
            <ArrowRight className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-800 bg-surface/50 px-6 py-14 text-center">
            <Compass className="mx-auto size-8 text-amber-400/40" />
            <p className="mt-3 text-sm text-stone-400">
              Popular packages will appear here soon — browse all packages in
              the meantime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-3xl border border-white/5 bg-surface transition hover:border-amber-300/20 hover:shadow-ember motion-safe:hover:-translate-y-1 motion-safe:duration-300"
              >
                <div className="relative h-52 w-full overflow-hidden bg-surface-2">
                  <PackageImage src={item.image} alt={item.name} />
                  <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-night/80 px-3 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
                    Nº {index + 1} · Trending
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-amber-50">{item.name}</h3>
                  <p className="mt-1.5 text-sm/6 text-stone-400">{item.headline}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
