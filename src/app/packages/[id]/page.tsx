"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import PackageImage from "@/app/components/PackageImage";
import AppointmentForm from "@/app/components/AppointmentForm";
import { useParams } from "next/navigation";
import { useItemStore, Item } from "../../store/itemStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  ArrowLeft,
  Clock,
  Tag,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function Product() {
  const { id } = useParams();
  const { items } = useItemStore();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      // First try to find in store (cache)
      const found = items.find((it) => it.id === id);
      if (found) {
        setItem(found);
        setLoading(false);
        return;
      }

      // If not in store, fetch directly from Firestore
      try {
        const docRef = doc(db, "items", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setItem({
            id: docSnap.id,
            name: data.name,
            category: data.category,
            headline: data.headline,
            description: data.description,
            processTime: data.processTime,
            price: data.price,
            image: data.image,
            requiredDocs: data.requiredDocs || [],
          });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching item:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id, items]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Package Not Found
        </h1>
        <p className="text-zinc-400 mb-4">
          The package you're looking for doesn't exist.
        </p>
        <Link
          href="/packages?category=all"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md font-medium hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Packages
        </Link>
      </div>
    );
  }

  return (
    <>
      <main className="pt-24 pb-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,146,60,0.05),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Back Button */}
          <Link
            href="/packages?category=all"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Packages
          </Link>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="group relative aspect-4/3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-[0_0_50px_rgba(251,146,60,0.06)]">
                <PackageImage src={item.image} alt={item.name} />
              </div>
              {/* Category Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm">
                  <Tag className="w-3.5 h-3.5" />
                  {item.category}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Title and Price */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-2">
                  {item.name}
                </h1>
                <p className="text-lg text-zinc-400">{item.headline}</p>
              </div>

              {/* Price Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Package Price</p>
                  <p className="text-3xl font-bold text-orange-400">
                    ${item.price}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-500 mb-1">Processing Time</p>
                  <p className="text-lg font-medium text-zinc-100 flex items-center gap-2 justify-end">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    {item.processTime}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-zinc-100 mb-2">
                  Description
                </h2>
                <p className="text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Required Documents */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-lg font-semibold text-zinc-100">
                    Required Documents
                  </h2>
                </div>
                <ul className="space-y-2">
                  {item.requiredDocs.map((doc, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-zinc-300 text-sm">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Appointment Form */}
              <AppointmentForm
                itemId={item.id}
                itemName={item.name}
                price={item.price}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
