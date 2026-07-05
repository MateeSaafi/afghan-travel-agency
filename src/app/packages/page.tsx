"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PackageImage from "../components/PackageImage";
import { useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Footer from "../components/Footer";
import { useItemStore, Item } from "../store/itemStore";
import { Package, ChevronLeft, ChevronRight, Clock } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const categories = [
  { label: "All", value: "all" },
  { label: "Visa", value: "visa" },
  { label: "Ticket", value: "ticket" },
  { label: "Scholarship", value: "scholarship" },
  { label: "Asylum", value: "asylum" },
  { label: "Online Form", value: "form" },
];

export default function Packages() {
  const { items, setItems } = useItemStore();
  const [displayItems, setDisplayItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const categoryFromURL = searchParams.get("category");

  const totalPages = Math.ceil(displayItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = displayItems.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const sortByLatest = (itemsToSort: Item[]) => {
    return [...itemsToSort].sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt - a.createdAt;
    });
  };

  const hasFetched = useRef(false);

  const getData = async (showSkeleton: boolean) => {
    if (showSkeleton) setIsLoading(true);
    try {
      const fetchedItems: Item[] = [];
      // Plain query: orderBy("createdAt") would silently exclude items that
      // don't have the field, so sorting happens client-side instead
      const querySnapshot = await getDocs(collection(db, "items"));
      querySnapshot.forEach((doc) => {
        fetchedItems.push({ id: doc.id, ...doc.data() } as Item);
      });
      const sortedItems = sortByLatest(fetchedItems);
      setItems(sortedItems);
      setDisplayItems(sortedItems);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Paint instantly from the localStorage cache, but ALWAYS refresh from
  // Firestore once per visit — otherwise newly added products never appear
  useEffect(() => {
    if (items.length > 0) setDisplayItems(items);
    if (!hasFetched.current) {
      hasFetched.current = true;
      getData(items.length === 0);
    }
  }, [items]);

  useEffect(() => {
    if (categoryFromURL) {
      setCurrentPage(1);
      if (categoryFromURL === "all") {
        setDisplayItems(sortByLatest(items));
      } else {
        const filtered = items.filter(
          (item) => item.category.toLowerCase() === categoryFromURL,
        );
        setDisplayItems(sortByLatest(filtered));
      }
    }
  }, [categoryFromURL, items]);

  return (
    <>
      <main className="pt-24 pb-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,146,60,0.05),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm font-medium">
              <Package className="w-4 h-4" />
              Browse Packages
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">
              Our Packages
            </h1>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex flex-wrap justify-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
              {categories.map((cat) => (
                <Link
                  key={cat.value}
                  href={`/packages?category=${cat.value}`}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    categoryFromURL === cat.value ||
                    (cat.value === "all" && !categoryFromURL)
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
                >
                  <div className="h-48 bg-zinc-800" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-zinc-800 rounded w-3/4" />
                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                    <div className="h-4 bg-zinc-800 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Empty State */}
              {displayItems.length < 1 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Package className="w-12 h-12 text-zinc-600 mb-4" />
                  <h2 className="text-xl text-zinc-400 font-medium">
                    No packages found
                  </h2>
                  <p className="text-zinc-500 mt-1">
                    Try selecting a different category
                  </p>
                </div>
              )}

              {/* Mobile: List Layout */}
              <div className="md:hidden space-y-3">
                {paginatedItems.map((item) => (
                  <Link key={item.id} href={`packages/${item.id}`}>
                    <div className="flex gap-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-orange-500/20 hover:shadow-[0_0_20px_rgba(251,146,60,0.06)] transition-all">
                      <div className="group relative shrink-0 w-20 h-20 overflow-hidden rounded-md bg-zinc-800">
                        <PackageImage src={item.image} alt={item.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-100 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {item.processTime}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-zinc-500 truncate pr-2">
                            {item.headline}
                          </p>
                          <span className="text-orange-400 font-semibold whitespace-nowrap">
                            ${item.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop: Card Grid Layout */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedItems.map((item) => (
                  <Link key={item.id} href={`packages/${item.id}`}>
                    <div className="group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-orange-500/20 hover:shadow-[0_0_30px_rgba(251,146,60,0.08)] transition-all duration-300">
                      <div className="relative h-48 overflow-hidden bg-zinc-800">
                        <PackageImage src={item.image} alt={item.name} />
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-1 bg-zinc-900/80 backdrop-blur-sm text-orange-400 text-sm font-semibold rounded-md border border-orange-500/30">
                            ${item.price}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-zinc-100 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-zinc-500 flex items-center gap-1 mb-2">
                          <Clock className="w-3.5 h-3.5" />
                          {item.processTime}
                        </p>
                        <p className="text-sm text-zinc-400 line-clamp-2">
                          {item.headline}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {!isLoading && displayItems.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-800">
              <span className="text-sm text-zinc-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
