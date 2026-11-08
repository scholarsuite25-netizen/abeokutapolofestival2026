"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ReportDownloadButtonProps {
  reportId: string;
  filename: string;
}

export function ReportDownloadButton({ reportId, filename }: ReportDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/admin/reports/${reportId}`);
      if (!res.ok) {
        throw new Error(`Failed to export manifest (Status: ${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download report. Please check permissions.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-1.5 text-xs font-semibold text-ivory shadow-xs transition-colors hover:bg-forest-interactive disabled:opacity-50 cursor-pointer"
    >
      {downloading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5 text-gold" />
          <span>Download Manifest</span>
        </>
      )}
    </button>
  );
}
