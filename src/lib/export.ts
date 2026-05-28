import { db } from "@/db/schema";

export async function exportDbJSON(): Promise<Blob> {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    trucks: await db.trucks.toArray(),
    parties: await db.parties.toArray(),
    drivers: await db.drivers.toArray(),
    trips: await db.trips.toArray(),
    expenses: await db.expenses.toArray(),
    ledger: await db.ledger.toArray(),
    driverPay: await db.driverPay.toArray(),
    settings: await db.settings.toArray(),
  };
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importDbJSON(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.version) throw new Error("Invalid backup file.");
  await db.transaction(
    "rw",
    [db.trucks, db.parties, db.drivers, db.trips, db.expenses, db.ledger, db.driverPay, db.settings],
    async () => {
      await Promise.all([
        db.trucks.clear(),
        db.parties.clear(),
        db.drivers.clear(),
        db.trips.clear(),
        db.expenses.clear(),
        db.ledger.clear(),
        db.driverPay.clear(),
        db.settings.clear(),
      ]);
      if (data.trucks?.length) await db.trucks.bulkAdd(data.trucks);
      if (data.parties?.length) await db.parties.bulkAdd(data.parties);
      if (data.drivers?.length) await db.drivers.bulkAdd(data.drivers);
      if (data.trips?.length) await db.trips.bulkAdd(data.trips);
      if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
      if (data.ledger?.length) await db.ledger.bulkAdd(data.ledger);
      if (data.driverPay?.length) await db.driverPay.bulkAdd(data.driverPay);
      if (data.settings?.length) await db.settings.bulkAdd(data.settings);
    }
  );
}

// PDF and Excel exports — dynamic import to keep main bundle light.
export async function exportTablePDF(opts: {
  title: string;
  subtitle?: string;
  head: string[];
  body: (string | number)[][];
  foot?: (string | number)[][];
  filename: string;
}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(opts.title, 14, 16);
  if (opts.subtitle) {
    doc.setFontSize(10);
    doc.text(opts.subtitle, 14, 22);
  }
  autoTable(doc, {
    startY: opts.subtitle ? 28 : 22,
    head: [opts.head],
    body: opts.body,
    foot: opts.foot,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(opts.filename);
}

export async function exportTableXLSX(opts: {
  sheetName: string;
  rows: Record<string, string | number>[];
  filename: string;
}) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(opts.rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, opts.sheetName);
  XLSX.writeFile(wb, opts.filename);
}
