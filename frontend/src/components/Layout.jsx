import { useState } from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-30 md:hidden animate-in fade-in" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 md:ml-64 w-full w-screen md:w-auto h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">LearnMate</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
          >
            <Menu size={24} />
          </button>
        </div>

        <main className="p-0 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;