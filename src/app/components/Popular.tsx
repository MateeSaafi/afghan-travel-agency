import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase";
import Image from "next/image";
import { TrendingUp } from "lucide-react";

type Item = {
  id: string;
  name: string;
  headline: string;
  image: string;
};

async function getPopularItems() {
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
}

export default async function Popular() {
  const items = await getPopularItems();

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            Most Requested
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
            Popular Packages
          </h2>
        </div>
        {items.length === 0 ? (
          <p className="text-zinc-500 text-center">No popular items found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-orange-500/20 hover:shadow-[0_0_30px_rgba(251,146,60,0.08)] transition-all duration-300"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    style={{ objectFit: "cover" }}
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-900/80 backdrop-blur-sm text-xs font-medium text-orange-300/90 border border-orange-500/30">
                      #{index + 1} Trending
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1">{item.name}</h3>
                  <p className="text-sm text-zinc-500">{item.headline}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
