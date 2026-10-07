import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reportApi } from '../../services/api/reportApi';
import { Report } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { formatDate } from '../../utils/helpers';
import { FileText, Download, Eye, Loader2, RefreshCw } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // PDF Preview State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Action state (for downloading single report loading spinner)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const filterPredictionId = searchParams.get('prediction');
  const previewReportId = searchParams.get('preview');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportApi.listReports(0, 100);
      setReports(res.reports);

      // If redirected to preview a report
      if (previewReportId) {
        const reportToPreview = res.reports.find((r) => r.id === Number(previewReportId));
        if (reportToPreview) {
          handleOpenPreview(reportToPreview);
        }
      }
    } catch (err) {
      console.error('Failed to load compliance reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [previewReportId]);

  const handleOpenPreview = async (report: Report) => {
    try {
      setPreviewLoading(true);
      setPreviewReport(report);
      setPreviewOpen(true);
      
      const blob = await reportApi.downloadReportBlob(report.id);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Failed to prepare PDF preview:', err);
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewReport(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      setActionLoadingId(report.id);
      const blob = await reportApi.downloadReportBlob(report.id);
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_report_${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns: Column<Report>[] = [
    {
      header: 'Report ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono text-dark-500">#REP-{row.id}</span>,
      sortable: true,
    },
    {
      header: 'Report Type',
      accessorKey: 'report_type',
      cell: (row) => <span className="capitalize font-semibold">{row.report_type} Report</span>,
      sortable: true,
    },
    {
      header: 'Generated Date',
      accessorKey: 'generated_at',
      cell: (row) => <span>{formatDate(row.generated_at, true)}</span>,
      sortable: true,
    },
    {
      header: 'File Location',
      accessorKey: 'pdf_path',
      cell: (row) => <span className="text-xs text-dark-400 font-mono block max-w-xs truncate">{row.pdf_path}</span>,
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenPreview(row)}
            title="Preview report PDF"
            className="h-8.5 w-8.5 p-0"
          >
            <Eye className="w-4 h-4 text-dark-500 hover:text-dark-900" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(row)}
            title="Download report PDF"
            disabled={actionLoadingId === row.id}
            className="h-8.5 w-8.5 p-0"
          >
            {actionLoadingId === row.id ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            ) : (
              <Download className="w-4 h-4 text-dark-500 hover:text-dark-900" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
            Compliance Reports
          </h1>
          <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
            View, inspect, and download PDF audits generated by the smart carbon platform.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchReports}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh List</span>
        </Button>
      </div>

      {/* Reports Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Audits Log</CardTitle>
          <CardDescription>Auditable compliance reports generated from BiLSTM inference computations.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={reports}
            loading={loading}
            searchKey="report_type"
            searchPlaceholder="Search by report type (e.g. general, country...)"
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* PDF Viewer Dialog */}
      <Dialog
        isOpen={previewOpen}
        onClose={handleClosePreview}
        title={previewReport ? `Compliance Report #REP-${previewReport.id}` : 'Compliance Report'}
        description={previewReport ? `Generated on ${formatDate(previewReport.generated_at, true)}` : ''}
        size="xl"
      >
        {previewLoading ? (
          <div className="h-[600px] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="text-sm text-dark-500 animate-pulse">Decrypting PDF audit file...</span>
          </div>
        ) : previewUrl ? (
          <iframe
            src={`${previewUrl}#toolbar=0`}
            title="PDF Compliance Report Preview"
            className="w-full h-[600px] rounded-2xl border border-dark-200 dark:border-dark-800"
          />
        ) : (
          <div className="h-[600px] flex items-center justify-center">
            <span className="text-sm text-danger font-semibold">Failed to prepare PDF viewer. Please download the file instead.</span>
          </div>
        )}
      </Dialog>
    </div>
  );
};
export default ReportsPage;
