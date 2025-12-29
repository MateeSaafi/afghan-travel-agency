"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumbs = () => {
  const pathname = usePathname();

  // Parse pathname to create breadcrumb segments
  const segments = pathname.split("/").filter(Boolean);

  // Map segment names to display names
  const segmentNameMap: { [key: string]: string } = {
    admin: "Admin",
    dashboard: "Dashboard",
    users: "Users",
    products: "Products",
    appointments: "Appointments",
  };

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const displayName = segmentNameMap[segment] || segment;

    return {
      href,
      label: displayName,
      isLast,
    };
  });

  // If we're on /admin, redirect to dashboard
  if (pathname === "/admin") {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-1 hover:text-zinc-100 transition-colors"
      >
        <Home size={14} />
      </Link>
      {breadcrumbItems.map((item, index) => (
        <div key={item.href} className="flex items-center gap-2">
          <ChevronRight size={14} className="text-zinc-600" />
          {item.isLast ? (
            <span className="text-zinc-100 font-medium">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-zinc-100 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
