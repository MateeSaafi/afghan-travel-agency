"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Menu,
  X,
  CalendarDays,
} from "lucide-react";

// Create context for sidebar state
const SidebarContext = createContext<{
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}>({
  isSidebarOpen: true,
  setIsSidebarOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

const AdminSidebar = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const pathname = usePathname();

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { id: "users", icon: Users, label: "Users", href: "/admin/users" },
    { id: "products", icon: ShoppingCart, label: "Products", href: "/admin/products" },
    { id: "appointments", icon: CalendarDays, label: "Appointments", href: "/admin/appointments" },
  ];

  return (
    <div
      className={`${
        isSidebarOpen ? "w-60" : "w-16"
      } bg-zinc-900 border-r border-zinc-800/80 transition-all duration-200 fixed h-[calc(100vh-56px)]`}
    >
      <div className="h-12 px-3 flex items-center justify-between border-b border-zinc-800/80">
        <span
          className={`text-sm font-semibold text-zinc-400 ${!isSidebarOpen && "hidden"}`}
        >
          Navigation
        </span>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full px-3 py-2 flex items-center gap-3 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
              }`}
            >
              <item.icon
                size={18}
                className={isActive ? "text-zinc-100" : ""}
              />
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
