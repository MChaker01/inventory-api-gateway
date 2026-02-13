import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import type { Session } from "../types/index";
import { AxiosError } from "axios";
import {
  LayoutList,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  Search,
} from "lucide-react";
import Spinner from "../components/Spinner";
import NewSessionModal from "../components/NewSessionModal";

const HistoriqueStock = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [depots, setDepots] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const navigate = useNavigate();

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Add &search=${debouncedSearch}
      const [historyRes, depotsRes, groupsRes] = await Promise.all([
        api.get(
          `/sessions/history?page=${page}&limit=10&search=${debouncedSearch}`,
        ),
        api.get("/resources/depots"),
        api.get("/resources/groups"),
      ]);

      setSessions(historyRes.data.data);
      setTotalPages(historyRes.data.pagination.totalPages);
      setDepots(depotsRes.data);
      setGroups(groupsRes.data);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Failed to load session history.", error);
      setError(
        error.response?.data?.message || "Failed to load session history.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Debounce Logic: Update 'debouncedSearch' only after 500ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to Page 1 when search changes
    }, 500);

    return () => clearTimeout(timer); // Cleanup if user types again
  }, [searchTerm]);

  // Helper to format SQL Dates (2026-02-07T10:00:00.000Z) -> Readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      // timeZone: "UTC",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER SECTION - Always Visible */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <LayoutList className="text-sky-700" />
            Historique Inventaire
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivi des sessions de comptage
          </p>
        </div>

        {/* SEARCH & ACTION BUTTONS */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {/* MOVED SEARCH BAR HERE */}
          <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-500 transition focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 w-full sm:w-64">
            <Search size={14} />
            <input
              type="text"
              placeholder="Recherche..."
              className="bg-transparent outline-none placeholder:text-slate-400 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="group relative overflow-hidden rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800 cursor-pointer"
            onClick={() => setIsModalFormOpen(true)}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus size={18} />
              Nouvelle Session
            </span>
            <span className="absolute inset-0 bg-linear-to-r from-sky-600 to-sky-700 opacity-0 transition group-hover:opacity-100" />
          </button>
        </div>
      </div>
      {/* DATA SECTION */}
      {isLoading && <Spinner />}
      {/* Empty State - Now with a "Clear Search" button */}
      {!isLoading && !error && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-20 text-slate-500">
          <LayoutList className="mb-4 h-9 w-9 text-slate-400" />
          <span className="text-sm">Aucune session trouvée</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-sky-600 hover:underline text-sm font-medium cursor-pointer"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      )}{" "}
      {/* Table */}
      {!isLoading && !error && sessions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Historique Stock
            </h2>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="min-w-225 w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left font-medium whitespace-nowrap">ID</th>
                  <th className="px-6 py-3 text-left font-medium whitespace-nowrap">État</th>
                  <th className="px-6 py-3 text-left font-medium whitespace-nowrap">
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left font-medium whitespace-nowrap">
                    Dépôt / Groupe
                  </th>
                  <th className="px-6 py-3 text-left font-medium whitespace-nowrap">
                    Responsable
                  </th>
                  <th className="px-6 py-3 text-right font-medium whitespace-nowrap">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      #{session.id}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.valide === 1 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                          <CheckCircle2 size={12} />
                          VALIDÉ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          <Clock size={12} />
                          EN COURS
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {formatDate(session.date)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {session.group_article}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={12} />
                          {session.depot}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                          {session.id_chef.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-700">
                          {session.id_chef}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/session/${session.id}`)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-sky-600 hover:text-sky-700 cursor-pointer"
                      >
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <span className="text-sm text-slate-600">
              Page <span className="font-semibold">{page}</span> sur{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
      <NewSessionModal
        isOpen={isModalFormOpen}
        onClose={() => setIsModalFormOpen(false)}
        onSuccess={fetchAllData}
        depots={depots}
        groups={groups}
      />
    </div>
  );
};

export default HistoriqueStock;
