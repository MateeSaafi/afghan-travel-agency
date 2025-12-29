"use client";
import AdminNav from "../components/AdminNav";
import AdminSidebar, { SidebarProvider, useSidebar } from "../components/AdminSidebar";
import Breadcrumbs from "../components/Breadcrumbs";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen } = useSidebar();

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex mt-14">
        <AdminSidebar />
        <div
          className={`flex-1 ${
            isSidebarOpen ? "ml-60" : "ml-16"
          } transition-all duration-200`}
        >
          <div className="p-6">
            <Breadcrumbs />
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
