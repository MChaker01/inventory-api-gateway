import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, MapPin } from "lucide-react";
import img from "../assets/smart_stock.png";

const Layout = () => {
  const { user, logout } = useAuth();

  // Get the current branch from storage to display it
  const currentBranch = localStorage.getItem("branch") || "Agadir";

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <img src={img} alt="Logo" className="h-8 w-8 object-contain" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                Smart Stock
              </h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Ziarfood
              </p>
            </div>
          </div>

          {/* Right Section: Branch Badge + User + Logout */}
          <div className="flex items-center gap-4">
            {/* Branch Indicator */}
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-100">
              <MapPin size={14} />
              <span className="capitalize">{currentBranch}</span>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            {/* User Info */}
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-700">
                  {user?.username}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {user?.role}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                <User size={16} />
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="ml-2 rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* <Outlet /> renders the child route (HistoriqueStock or SessionDetails) */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
