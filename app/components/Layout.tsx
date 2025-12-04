import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-secondary/10 via-transparent to-transparent opacity-50"></div>
      </div>

      <Sidebar />
      <main className="flex-1 w-full lg:w-auto lg:pl-64 overflow-x-hidden z-10 flex flex-col h-screen">
        <Header />
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
