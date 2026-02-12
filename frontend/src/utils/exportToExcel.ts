// client/src/utils/exportToExcel.ts
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Define the types we need
interface ExportItem {
  code_article: string;
  article: string;
  qte_globale: number;
  qte_physique: number;
}

interface ExportOptions {
  items: ExportItem[];
  companyName?: string;
  depot?: string;
  group?: string;
  mode: "STOCK" | "ECARTS";
}

export const generateExcelFile = async ({
  items,
  companyName = "ZIARFOOD AGADIR",
  depot = "Inconnu",
  group = "Inconnu",
  mode,
}: ExportOptions) => {
  if (items.length === 0) {
    alert("Aucune donnée à exporter");
    return;
  }

  // 1. Create Workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Inventaire");

  // 2. Add Header Block
  const dateStr = new Date().toLocaleDateString("fr-FR");
  worksheet.addRow([companyName]);
  worksheet.addRow(["Date :", dateStr]);
  worksheet.addRow(["Dépôt :", depot]);
  worksheet.addRow(["Groupe :", group]);
  worksheet.addRow([]); // Spacer

  // Style Title
  const titleCell = worksheet.getCell("A1");
  titleCell.font = { size: 16, bold: true };
  worksheet.mergeCells("A1:C1");

  // 3. Add Table Headers
  const headerRow = worksheet.addRow([
    "Code Article",
    "Article",
    "Qté Sys",
    "Qté Phy",
    "Ecart",
    "Note",
  ]);

  // Style Header
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" }, // Blue
    };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.alignment = { horizontal: "center" };
    cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
    };
  });

  // 4. Add Data
  items.forEach((item) => {
    const gap = item.qte_physique - item.qte_globale;
    const row = worksheet.addRow([
      item.code_article,
      item.article,
      item.qte_globale,
      item.qte_physique,
      gap,
      "",
    ]);

    // Color Logic
    const gapCell = row.getCell(5);
    if (gap < 0) gapCell.font = { color: { argb: "FFFF0000" }, bold: true };
    if (gap > 0) gapCell.font = { color: { argb: "FF008000" }, bold: true };

    // Borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // 5. Widths
  worksheet.getColumn(1).width = 15;
  worksheet.getColumn(2).width = 50;
  worksheet.getColumn(3).width = 10;
  worksheet.getColumn(4).width = 10;
  worksheet.getColumn(5).width = 10;
  worksheet.getColumn(6).width = 20;

  // 6. Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = `Inventaire_${mode}_${depot}_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};