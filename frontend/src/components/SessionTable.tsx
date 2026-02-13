import { ChevronLeft, ChevronRight } from "lucide-react";
import Spinner from "./Spinner";
import type { SocketItem } from "../types";

interface SessionTableProps {
  items: SocketItem[]; // These are already filtered by the parent
  isLoading: boolean;
  isLocked: boolean;
  // New Props for Pagination Control
  currentPage: number;
  onPageChange: (page: number) => void;

  onUpdateQuantity: (id: number, qty: string) => void;
}

const ITEMS_PER_PAGE = 20;

const SessionTable = ({
  items,
  isLoading,
  isLocked,
  currentPage, // <--- Received from Parent
  onPageChange, // <--- Callback to Parent
  onUpdateQuantity,
}: SessionTableProps) => {
  // Calculate Total Pages
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  // Slice the data for the current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage); // Notify Parent
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-16 text-center text-slate-500">
        Aucun article trouvé.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="w-full overflow-x-auto">
        <table className="min-w-175 w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left font-medium whitespace-nowrap">
                Code
              </th>
              <th className="px-6 py-4 text-left font-medium whitespace-nowrap">
                Article
              </th>
              <th className="px-6 py-4 text-center font-medium whitespace-nowrap">
                Qté Système
              </th>
              <th className="px-6 py-4 text-center font-medium w-36 whitespace-nowrap">
                Qté Physique
              </th>
              <th className="px-6 py-4 text-center font-medium whitespace-nowrap">
                Ecart
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {currentItems.map((item) => {
              const gap = item.qte_physique - item.qte_globale;
              let colorClass = "text-slate-500";
              if (gap < 0) colorClass = "text-red-600 font-bold";
              if (gap > 0) colorClass = "text-emerald-600 font-bold";

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-slate-600 whitespace-nowrap">
                    {item.code_article}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {item.article}
                  </td>

                  <td className="px-6 py-4 text-center text-slate-500 whitespace-nowrap">
                    {item.qte_globale}
                  </td>

                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      defaultValue={item.qte_physique}
                      disabled={isLocked}
                      onBlur={(e) => onUpdateQuantity(item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      className={`w-24 rounded-md border border-slate-300 px-2 py-1.5 text-center font-semibold outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 ${
                        isLocked ? "bg-slate-100 text-slate-400" : "bg-white"
                      }`}
                    />
                  </td>

                  <td
                    className={`px-6 py-4 text-center whitespace-nowrap ${colorClass}`}
                  >
                    {gap > 0 ? `+${gap}` : gap}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-4">
          <p className="text-sm text-slate-600 text-center sm:text-left">
            Affichage de <span className="font-medium">{startIndex + 1}</span> à{" "}
            <span className="font-medium">
              {Math.min(startIndex + ITEMS_PER_PAGE, items.length)}
            </span>{" "}
            sur <span className="font-medium">{items.length}</span> articles
          </p>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm font-medium text-slate-900 px-2">
              Page {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionTable;
