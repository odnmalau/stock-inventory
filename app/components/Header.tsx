import { Link, useLocation } from "react-router";
import { User, LogOut, ChevronDown, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import { SidebarContent } from "./Sidebar";

export function Header() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getBreadcrumbName = (segment: string) => {
    switch (segment) {
      case "products": return "Data Produk";
      case "inbound": return "Barang Masuk";
      case "outbound": return "Barang Keluar";
      case "opname": return "Stock Opname";
      case "reports": return "Laporan Opname";
      case "stock-card": return "Kartu Stok";
      case "profile": return "Profile";
      default: return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Trigger */}
        <div className="lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Navigation Menu</SheetDescription>
              <SidebarContent onLinkClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {pathSegments.length === 0 ? "Dashboard" : getBreadcrumbName(pathSegments[0])}
        </h2>
      </div>

      <div className="relative" ref={dropdownRef}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 rounded-full bg-muted/50 px-3"
          onClick={() => setProfileOpen(!profileOpen)}
        >
          <User className="h-5 w-5" />
          <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
        </Button>

        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-background shadow-lg py-1 z-50">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
              onClick={() => setProfileOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <hr className="my-1 border-border" />
            <Link
              to="/logout"
              className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => setProfileOpen(false)}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
