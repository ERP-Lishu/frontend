import * as XLSX from "xlsx";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel(filename: string, sheetName: string, columns: ExcelColumn[], rows: Record<string, string>[]) {
  const header = columns.map((c) => c.header);
  const data = rows.map((row) => columns.map((c) => row[c.key] ?? ""));

  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

  // Column widths
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? 18 }));

  // Bold header row
  columns.forEach((_, ci) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[cellAddr]) return;
    ws[cellAddr].s = { font: { bold: true } };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
