import { useState, type SubmitEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import img from "../assets/smart_stock.png";
import { User, Lock, Loader2, AlertCircle } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const navigate = useNavigate();

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault(); // stop page reload;

    setIsLoading(true);
    setError("");

    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>; // Type Casting
      console.error("Error while login", error);
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-100 text-slate-900">
      {/* Left – Brand / Context */}
      <div className="relative hidden lg:flex flex-col justify-between px-16 py-14 bg-white border-r border-slate-200">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-size-[64px_64px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <img src={img} alt="" className="h-12 w-12 object-contain" />
            <div>
              <div className="text-xl font-semibold tracking-wide text-slate-900">
                Smart Stock
              </div>
              <div className="text-xs text-slate-500">
                Ziarfood Distribution
              </div>
            </div>
          </div>

          <h1 className="mt-24 text-[44px] font-semibold leading-tight tracking-tight text-slate-900">
            Inventory clarity
            <br />
            <span className="text-sky-700">for real operations</span>
          </h1>

          <p className="mt-6 max-w-md text-slate-600 leading-relaxed">
            Manage food and household stock with precision.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} Ziarfood · Internal System
        </div>
      </div>

      {/* Right – Login */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Access the secure gateway
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Username
              </label>
              {/* INPUT WRAPPER */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className="w-full rounded-md border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Password
              </label>
              {/* INPUT WRAPPER */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-sky-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
