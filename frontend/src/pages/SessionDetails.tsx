import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AxiosError } from "axios";
import { api } from "../api/axios";
import { generateExcelFile } from "../utils/exportToExcel";
import SessionTable from "../components/SessionTable";

import {
  Save,
  Search,
  Lock,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  BadgeCheck,
  AlertTriangle,
  Download,
} from "lucide-react";

import type { Session, SocketItem } from "../types/index";

const SessionDetails = () => {
  const [items, setItems] = useState<SocketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, itemsRes] = await Promise.all([
          api.get(`/sessions/${id}`),
          api.get(`/sessions/${id}/items`),
        ]);

        setSession(sessionRes.data);
        setItems(itemsRes.data.items);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showErrorsOnly]);

  const stats = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const gap = item.qte_physique - item.qte_globale;
        return {
          netGap: acc.netGap + gap,
          totalErrors: acc.totalErrors + (gap !== 0 ? 1 : 0),
          totalItems: acc.totalItems + 1,
          itemsCounted: acc.itemsCounted + (item.qte_physique > 0 ? 1 : 0),
        };
      },
      { netGap: 0, totalErrors: 0, totalItems: 0, itemsCounted: 0 },
    );
  }, [items]);

  const handleUpdateQuantity = async (itemId: number, newQuantity: string) => {
    const qty = parseFloat(newQuantity);
    if (isNaN(qty) || qty < 0) {
      alert("Invalid quantity");
      return;
    }
    try {
      await api.put(`/sessions/items/${itemId}`, { quantity: qty });
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, qte_physique: qty } : item,
        ),
      );
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to save quantity.");
    }
  };

  const handleValidateSession = async () => {
    const confirm = window.confirm(
      "Êtes-vous sûr de vouloir valider cet inventaire ?",
    );
    if (!confirm) return;

    try {
      await api.put(`/sessions/${id}/validate`, {
        username: user?.username || "Admin",
      });
      alert("Inventaire validé avec succès !");
      navigate("/");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || "Erreur lors de la validation");
    }
  };

  const filteredItems = items.filter((item) => {
    // FIX: If article name is missing, use empty string ""
    const articleName = (item.article || "").toLowerCase();
    const articleCode = (item.code_article || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      articleName.includes(search) || articleCode.includes(search);

    if (showErrorsOnly) {
      const gap = item.qte_physique - item.qte_globale;
      return matchesSearch && gap !== 0;
    }
    return matchesSearch;
  });

  const handleExport = () => {
    generateExcelFile({
      items: filteredItems,
      depot: session?.depot,
      group: session?.group_article,
      mode: showErrorsOnly ? "ECARTS" : "STOCK",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Session #{id}
            </h1>
            {session?.valide === 1 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <BadgeCheck size={14} />
                Validée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                <Lock size={14} />
                En cours
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">Comptage des articles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progress Card */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-6 transition">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-sky-600" />
                <p className="text-sm font-medium text-slate-600">
                  Progression
                </p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-slate-900">
                {stats.itemsCounted}
                <span className="text-base font-medium text-slate-400">
                  {" "}
                  / {stats.totalItems}
                </span>
              </p>
              <p className="text-sm font-semibold text-sky-600">
                {stats.totalItems > 0
                  ? Math.round((stats.itemsCounted / stats.totalItems) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-sky-500"
                style={{
                  width:
                    stats.totalItems > 0
                      ? `${(stats.itemsCounted / stats.totalItems) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>

          {/* Gap Card */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-6 transition">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                {stats.netGap > 0 ? (
                  <TrendingUp size={18} className="text-emerald-600" />
                ) : stats.netGap < 0 ? (
                  <TrendingDown size={18} className="text-red-600" />
                ) : (
                  <Minus size={18} className="text-slate-500" />
                )}
                <p className="text-sm font-medium text-slate-600">
                  Écart Global
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold ${stats.netGap > 0 ? "text-emerald-600" : stats.netGap < 0 ? "text-red-600" : "text-slate-900"}`}
              >
                {stats.netGap > 0 ? `+${stats.netGap}` : stats.netGap}
              </span>
              <span className="text-sm text-slate-400">unités</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {stats.totalErrors} lignes avec écart
            </p>
          </div>
        </div>

        {/* SEARCH & ACTION BAR */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72 rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
              />
            </div>
            <button
              onClick={() => setShowErrorsOnly(!showErrorsOnly)}
              className={`group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 cursor-pointer text-sm font-medium transition-all border ${showErrorsOnly ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}
            >
              <AlertTriangle
                size={16}
                className={showErrorsOnly ? "text-amber-600" : "text-slate-400"}
              />
              {showErrorsOnly ? "Afficher tout" : "Voir les écarts"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition text-sm font-medium cursor-pointer"
            >
              <Download size={18} /> Exporter
            </button>
            {session?.valide === 0 ? (
              <button
                onClick={handleValidateSession}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Save size={16} /> Valider
                </span>
                <span className="absolute inset-0 bg-linear-to-r from-sky-600 to-sky-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500">
                <Lock size={16} /> Verrouillé
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="mx-auto max-w-6xl">
        <SessionTable
          items={filteredItems}
          isLoading={isLoading}
          isLocked={session?.valide === 1}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onUpdateQuantity={handleUpdateQuantity}
        />
      </div>
    </div>
  );
};

export default SessionDetails;
