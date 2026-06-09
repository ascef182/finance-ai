"use client";

import { DownloadIcon } from "lucide-react";

import { Button } from "@/app/_components/ui/button";

const ExportCsvButton = () => {
  const handleExport = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    window.location.href = `/api/export/transactions?month=${month}&year=${year}`;
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <DownloadIcon className="mr-2 h-4 w-4" />
      Exportar CSV
    </Button>
  );
};

export default ExportCsvButton;
