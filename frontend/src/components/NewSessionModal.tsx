import { useState } from "react";
import * as XLSX from "xlsx";
import { api } from "../api/axios"; // Import API
import { useAuth } from "../context/AuthContext"; // Import Auth to get username
import { AxiosError } from "axios";

// 1. Define Props Interface
interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // <--- The callback to refresh the parent
  depots: string[];
  groups: string[];
}

// 2. Define Internal Types
interface ParsedItem {
  code_article: string;
  article_name: string;
  qte_globale: number;
}

// 3. The "Excel Row" Type (The fix for 'any')
// This says: "An object with string keys, where values can be string, number, or null"
interface ExcelRow {
  [key: string]: string | number | undefined | null;
}

const NewSessionModal = ({
  isOpen,
  onClose,
  onSuccess,
  depots,
  groups,
}: NewSessionModalProps) => {
  const [selectedDepot, setSelectedDepot] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth(); // Get current user

  // --- EXCEL PARSING LOGIC ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setIsLoading(true);
    setError("");

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Cast the result to our ExcelRow type
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          range: 8,
          defval: "",
        }) as ExcelRow[];

        if (!jsonData || jsonData.length === 0) {
          throw new Error("Le fichier Excel est vide.");
        }

        // Find Quantity Column Logic
        const firstRow = jsonData[0];
        const columnNames = Object.keys(firstRow);
        const qtyColumnName = columnNames.find(
          (col) =>
            col.toLowerCase().includes("stk") &&
            col.toLowerCase().includes("unit"),
        );

        // Find Name Column
        // Look for "Article", "Designation", or "Description"
        const nameColumnName = columnNames.find(
          (col) =>
            col.toLowerCase().includes("article") ||
            col.toLowerCase().includes("designation") ||
            col.toLowerCase().includes("description"),
        );

        if (!qtyColumnName) {
          throw new Error("Colonne 'Stk Unité' introuvable.");
        }

        // Filtering Logic (No more 'any')
        const dataRows = jsonData.filter((row: ExcelRow) => {
          const code = String(row["Code"] || "")
            .trim()
            .toLowerCase();
          return code && code !== "total";
        });

        // Mapping Logic
        const items = dataRows.map((row: ExcelRow) => {
          const code = String(row["Code"] || "").trim();
          const stkUniteValue = row[qtyColumnName];

          // Extract Name
          // If column not found, default to empty string
          const name = nameColumnName
            ? String(row[nameColumnName] || "").trim()
            : "";

          let qte = 0;
          if (typeof stkUniteValue === "number") {
            qte = stkUniteValue;
          } else if (typeof stkUniteValue === "string") {
            // Handle "1 200,50" formats if necessary
            qte =
              parseFloat(stkUniteValue.replace(/\s/g, "").replace(",", ".")) ||
              0;
          }

          return {
            code_article: code,
            article_name: name,
            qte_globale: qte,
          };
        });

        // Validation
        const cleanItems = items.filter(
          (item) => item.code_article.length > 0 && !isNaN(item.qte_globale),
        );

        if (cleanItems.length === 0)
          throw new Error("Aucun article valide trouvé.");

        setParsedItems(cleanItems);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Erreur de lecture Excel",
        );
        setParsedItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  // --- SUBMIT LOGIC ---
  const handleCreateSession = async () => {
    if (!selectedDepot || !selectedGroup || parsedItems.length === 0) return;

    setIsLoading(true);
    try {
      const payload = {
        depot: selectedDepot,
        group_article: selectedGroup,
        id_chef: user?.username || "Unknown",
        items: parsedItems,
      };

      await api.post("/sessions", payload);

      onSuccess(); // Refresh Parent
      onClose(); // Close Modal

      // Cleanup
      setParsedItems([]);
      setSelectedDepot("");
      setSelectedGroup("");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || "Erreur création session");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Nouvelle Session</h2>

        {/* Step 1: Select Depot */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Dépôt *
          </label>
          <select
            value={selectedDepot}
            onChange={(e) => setSelectedDepot(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Sélectionner un dépôt</option>
            {depots.map((depot) => (
              <option key={depot} value={depot}>
                {depot}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Select Group */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Groupe Article *
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Sélectionner un groupe</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Upload Excel */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fichier Excel *
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            disabled={isLoading}
          />
          {isLoading && (
            <p className="text-sm text-slate-500 mt-2">
              📄 Lecture du fichier en cours...
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Preview Table - Show after successful parse */}
        {parsedItems.length > 0 && (
          <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                📦 {parsedItems.length} articles importés
              </span>
              <button
                onClick={() => {
                  setParsedItems([]);
                  setError("");
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
              >
                Réinitialiser
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                      Code Article
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                      Article
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">
                      Qté Globale
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {parsedItems.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-xs">
                        {item.code_article}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-700 truncate max-w-50">
                        {item.article_name}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.qte_globale}
                      </td>
                    </tr>
                  ))}
                  {parsedItems.length > 10 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-2 text-center text-xs text-slate-500"
                      >
                        ... et {parsedItems.length - 10} autres articles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            disabled={
              !selectedDepot ||
              !selectedGroup ||
              parsedItems.length === 0 ||
              isLoading
            }
            className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            onClick={handleCreateSession}
          >
            Créer Session ({parsedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSessionModal;
