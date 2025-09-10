import { FileText, FileSpreadsheet, FileArchive, Link as LinkIcon } from "lucide-react";

export type DocumentFile = {
  title: string;
  type?: "pdf" | "doc" | "xls" | "zip" | "link";
  size?: string;
  href?: string;
  date?: string;
};

function DocIcon({ type }: { type?: DocumentFile["type"] }) {
  switch (type) {
    case "xls":
      return <FileSpreadsheet className="h-5 w-5" />;
    case "zip":
      return <FileArchive className="h-5 w-5" />;
    case "link":
      return <LinkIcon className="h-5 w-5" />;
    case "pdf":
    case "doc":
    default:
      return <FileText className="h-5 w-5" />;
  }
}

export function DocumentRow({ doc }: { doc: DocumentFile }) {
  return (
    <a
      href={doc.href || "#"}
      className="group flex items-center justify-between gap-4 rounded-lg border px-4 py-3 hover:bg-accent transition-all duration-300 ease-in-out hover:scale-[1.01] shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-4 min-w-0">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary/80 text-secondary-foreground flex-shrink-0">
          <DocIcon type={doc.type} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-base group-hover:text-primary transition-colors">{doc.title}</p>
          {(doc.size || doc.date) && (
            <p className="truncate text-xs text-muted-foreground mt-1">
              {[doc.date, doc.size].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
      </div>
      <span className="text-base font-semibold text-primary/90 group-hover:text-primary transition-colors">Tải xuống →</span>
    </a>
  );
}

