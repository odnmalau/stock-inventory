import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  ClipboardList,
  FileText,
  Menu,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Package, label: "Produk", href: "/products" },
  { icon: ArrowRightLeft, label: "Barang Masuk", href: "/inbound" },
  { icon: ArrowRightLeft, label: "Barang Keluar", href: "/outbound" },
  { icon: ClipboardList, label: "Stock Opname", href: "/opname" },
  { icon: FileText, label: "Laporan Opname", href: "/reports" },
  { icon: FileText, label: "Kartu Stok", href: "/stock-card" },
];

export function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">Inventory<span className="text-foreground">.App</span></h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            // Custom active logic for query params
            let isActive = false;
            if (item.href === "/") {
                isActive = location.pathname === "/";
            } else if (item.href.includes("?")) {
                const [path, query] = item.href.split("?");
                const type = new URLSearchParams(query).get("type");
                const currentType = new URLSearchParams(location.search).get("type");
                isActive = location.pathname === path && (currentType === type || (!currentType && type === "opname"));
            } else {
                isActive = location.pathname.startsWith(item.href);
            }

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onLinkClick}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                  )}
                  <item.icon size={20} className={clsx("transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:block fixed top-0 left-0 h-screen w-64 z-50">
      <SidebarContent />
    </aside>
  );
}
