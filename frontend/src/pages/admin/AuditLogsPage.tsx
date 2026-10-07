import React, { useEffect, useState } from 'react';
import { userApi } from '../../services/api/userApi';
import { AuditLog } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/helpers';
import { History, RefreshCw, ShieldCheck } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await userApi.getAuditLogs(0, 100);
      setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      header: 'Log ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono text-dark-500">#LOG-{row.id}</span>,
      sortable: true,
    },
    {
      header: 'Event Action',
      accessorKey: 'action',
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300">
          {row.action}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'User Identity',
      accessorKey: 'user_name',
      cell: (row) => <span className="font-semibold text-dark-800 dark:text-dark-200">{row.user_name}</span>,
      sortable: true,
    },
    {
      header: 'IP Address',
      accessorKey: 'ip_address',
      cell: (row) => <span className="font-mono text-xs text-dark-500">{row.ip_address || '127.0.0.1'}</span>,
    },
    {
      header: 'Event Timestamp',
      accessorKey: 'timestamp',
      cell: (row) => <span>{formatDate(row.timestamp, true)}</span>,
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
            Audit Trail Registry
          </h1>
          <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
            Auditable system-wide logs tracking logins, prediction operations, and user changes.
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs} className="flex items-center gap-2 self-start sm:self-auto select-none">
          <RefreshCw className="w-4 h-4" />
          <span>Sync Registry</span>
        </Button>
      </div>

      {/* Logs Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-dark-100 dark:border-dark-800 pb-4">
          <div>
            <CardTitle>System Activity Logs</CardTitle>
            <CardDescription>Immutable trail of access points, token updates, and model activations.</CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-450 font-semibold select-none">
            <ShieldCheck className="w-4.5 h-4.5" />
            <span>GDPR Compliant Logs</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            searchKey="action"
            searchPlaceholder="Search events by action (e.g. LOGIN, REGISTER...)"
            pageSize={15}
          />
        </CardContent>
      </Card>
    </div>
  );
};
export default AuditLogsPage;
