import { useEffect, useState } from "react";
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

  // FETCH DATA
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [history_response, depots_response, groups_response] =
          await Promise.all([
            api.get("/sessions/history"),
            api.get("/resources/depots"),
            api.get("/resources/groups"),
          ]);

        setSessions(history_response.data.history);
        setDepots(depots_response.data);
        setGroups(groups_response.data);
      } catch (err) {
        const error = err as AxiosError<{ message: string }>; // Type Casting
        console.error("Failed to load session history.", error);
        setError(
          error.response?.data?.message || "Failed to load session history.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Helper to format SQL Dates (2026-02-07T10:00:00.000Z) -> Readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutList className="text-sky-600" />
            Historique Inventaire
          </h1>
          <p className="text-slate-500 mt-1">Suivi des sessions de comptage</p>
        </div>

        <button
          className="flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800 hover:shadow-md"
          onClick={() => {
            setIsModalFormOpen(true);
          }}
        >
          <Plus size={18} />
          Nouvelle Session
        </button>
      </div>
      {/* Loading State */}
      {isLoading && <Spinner />}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-slate-500">
          <LayoutList className="mb-4 h-8 w-8 text-slate-400" />
          <span className="text-sm">No stock sessions found</span>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && sessions.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Historique Stock
            </h1>

            <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <Search size={14} />
              <span>Recherche</span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left font-medium">ID</th>
                <th className="px-6 py-3 text-left font-medium">État</th>
                <th className="px-6 py-3 text-left font-medium">
                  Date & Heure
                </th>
                <th className="px-6 py-3 text-left font-medium">
                  Dépôt / Groupe
                </th>
                <th className="px-6 py-3 text-left font-medium">Responsable</th>
                <th className="px-6 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    #{session.id}
                  </td>

                  <td className="px-6 py-4">
                    {session.valide === 1 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        VALIDÉ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                        <Clock size={12} />
                        EN COURS
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{formatDate(session.date)}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
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

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                        {session.id_chef.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-700">{session.id_chef}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-sky-600 hover:text-sky-700">
                      ouvrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <NewSessionModal
        isOpen={isModalFormOpen}
        onClose={() => setIsModalFormOpen(false)}
        depots={depots}
        groups={groups}
      />
    </div>
  );
};

export default HistoriqueStock;
