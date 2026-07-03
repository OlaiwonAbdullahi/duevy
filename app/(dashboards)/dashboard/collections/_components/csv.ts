import type { CollectionStudent } from "./types";

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function downloadCollectionCsv(
  filename: string,
  rows: CollectionStudent[],
) {
  const headers = [
    "Name",
    "Matric number",
    "Level",
    "Email",
    "Status",
    "Paid at",
    "Reference",
  ];
  const body = rows.map((student) =>
    [
      student.name,
      student.matricNo,
      student.level,
      student.email,
      student.status,
      student.paidAt ?? "",
      student.reference ?? "",
    ]
      .map(csvEscape)
      .join(","),
  );
  const blob = new Blob([[headers.join(","), ...body].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
