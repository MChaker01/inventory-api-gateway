import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AxiosError } from "axios";
import { api } from "../api/axios";
import { ArrowLeft, Save, Search } from "lucide-react";

interface SocketItem {
  id: number;
  code_article: string;
  article: string;
  Prix: number;
  qte_globale: number; // Theory (System)
  qte_physique: number; // Actual (Counted)
}

const SessionDetails = () => {
  const [items, setItems] = useState<SocketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get(`/sessions/${id}/items`);
        setItems(response.data.items);
      } catch (error) {
        console.error("Error loading items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchItems();
  }, [id]);

  // Calculate totals only when 'items' changes
  const stats = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const gap = item.qte_physique - item.qte_globale;

        return {
          // Net Gap: (-5 + 2 = -3). Shows overall shortage/surplus.
          netGap: acc.netGap + gap,

          // Absolute Error: (|-5| + |2| = 7). Shows how messy the inventory is.
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

    // 1. Validate
    if (isNaN(qty) || qty < 0) {
      alert("Invalid quantity");
      return;
    }

    try {
      // 2. Call API (PUT /api/sessions/items/:id)
      await api.put(`/sessions/items/${itemId}`, { quantity: qty });

      // 3. Update Local State (Visual feedback)
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, qte_physique: qty } : item,
        ),
      );

      console.log(`Item ${itemId} updated to ${qty}`);
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to save quantity. Please try again.");
    }
  };

  const handleValidateSession = async () => {
    // 1. Safety Check
    const confirm = window.confirm(
      "Êtes-vous sûr de vouloir valider cet inventaire ?\n\nCette action est irréversible. Une fois validé, vous ne pourrez plus modifier les quantités.",
    );

    if (!confirm) return;

    try {
      // 2. Call API
      await api.put(`/sessions/${id}/validate`, {
        username: user?.username || "Admin",
      });

      // 3. Success Feedback
      alert("Inventaire validé avec succès !");

      // 4. Redirect to Dashboard
      navigate("/");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>; // Type Casting
      alert(error.response?.data?.message || "Erreur lors de la validation");
    }
  };

  // Filter items based on search
  const filteredItems = items.filter(
    (item) =>
      item.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code_article.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6 space-y-6">
      {/* HEADER */}
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top Row: Back + Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-200"
            >
              <ArrowLeft size={22} />
            </button>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Session #{id}
              </h1>
              <p className="text-sm text-slate-500">Comptage des articles</p>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Progress Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">
                Progression du comptage
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                📦
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.itemsCounted}
                  <span className="text-base font-medium text-slate-400">
                    {" "}
                    / {stats.totalItems}
                  </span>
                </p>

                <p className="text-xs text-slate-400 mt-1">Articles comptés</p>
              </div>

              <p className="text-sm font-semibold text-sky-600">
                {stats.totalItems > 0
                  ? Math.round((stats.itemsCounted / stats.totalItems) * 100)
                  : 0}
                %
              </p>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-sky-500 to-sky-600 transition-all duration-500"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Écart Global</p>

              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  stats.netGap === 0
                    ? "bg-slate-100 text-slate-600"
                    : stats.netGap > 0
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-red-100 text-red-600"
                }`}
              >
                {stats.netGap === 0 ? "➖" : stats.netGap > 0 ? "⬆" : "⬇"}
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold ${
                  stats.netGap === 0
                    ? "text-slate-900"
                    : stats.netGap > 0
                      ? "text-emerald-600"
                      : "text-red-600"
                }`}
              >
                {stats.netGap > 0 ? `+${stats.netGap}` : stats.netGap}
              </span>

              <span className="text-sm text-slate-400">unités</span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {stats.totalErrors} ligne{stats.totalErrors > 1 && "s"} avec écart
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
            />
          </div>

          <button
            onClick={handleValidateSession}
            className="group relative overflow-hidden rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800 shadow-sm"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Save size={16} />
              Valider
            </span>
            <span className="absolute inset-0 bg-linear-to-r from-sky-600 to-sky-700 opacity-0 transition group-hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 text-left font-medium">Code</th>
              <th className="px-6 py-4 text-left font-medium">Article</th>
              <th className="px-6 py-4 text-center font-medium">Qté Système</th>
              <th className="px-6 py-4 text-center font-medium w-36">
                Qté Physique
              </th>
              <th className="px-6 py-4 text-center">Ecart</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredItems.map((item) => {
              // 1. Calculate the Gap
              const gap = item.qte_physique - item.qte_globale;

              // 3. Determine Color (Visual Feedback)
              let colorClass = "text-slate-500"; // Default (Zero)
              if (gap < 0) colorClass = "text-red-600 font-bold"; // Loss
              if (gap > 0) colorClass = "text-emerald-600 font-bold"; // Surplus

              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-slate-600">
                    {item.code_article}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900">
                    {item.article}
                  </td>

                  <td className="px-6 py-4 text-center text-slate-500">
                    {item.qte_globale}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      defaultValue={item.qte_physique}
                      onBlur={(e) =>
                        handleUpdateQuantity(item.id, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-center font-semibold text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
                    />
                  </td>

                  {/* NEW: Ecart Column */}
                  <td className={`px-6 py-4 text-center ${colorClass}`}>
                    {gap > 0 ? `+${gap}` : gap}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty */}
        {filteredItems.length === 0 && !isLoading && (
          <div className="py-16 text-center text-sm text-slate-500">
            Aucun article trouvé.
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetails;
