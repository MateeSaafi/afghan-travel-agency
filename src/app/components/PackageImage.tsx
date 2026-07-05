"use client";
import Image from "next/image";
import { useState } from "react";
import { Compass } from "lucide-react";

export default function PackageImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        aria-hidden="true"
        className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-surface-2 via-[#1b130c] to-night"
      >
        <Compass className="size-8 text-amber-400/40" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
          Afghan Travel
        </span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
      className="object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  );
}
