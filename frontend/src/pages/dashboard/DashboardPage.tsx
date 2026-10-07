import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../services/api/dashboardApi';
import { predictionApi } from '../../services/api/predictionApi';
import { DashboardOverview, EmissionTrendPoint, CreditTrendPoint, Prediction } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { EmissionTrendChart } from '../../components/charts/EmissionTrendChart';
import { CreditTrendChart } from '../../components/charts/CreditTrendChart';
import { formatNumber, formatDate, formatCompactNumber } from '../../utils/helpers';
import { Cpu, Leaf, Coins, FileSpreadsheet, ArrowRight, ShieldAlert } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store/store';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [emissionsTrend, setEmissionsTrend] = useState<EmissionTrendPoint[]>([]);
  const [creditTrend, setCreditTrend] = useState<CreditTrendPoint[]>([]);
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [ovData, emData, crData, predData] = await Promise.all([
          dashboardApi.getOverview(),
          dashboardApi.getEmissionsTrend(),
          dashboardApi.getCreditTrend(),
          predictionApi.listUserPredictions(0, 5),
        ]);

        setOverview(ovData);
        
        // Map month numbers to labels
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const formattedEmTrend = emData.map((d: any) => ({
          month: `${monthNames[(d.month - 1) % 12]} ${d.year}`,
          emissions: d.total_emissions,
        }));
        setEmissionsTrend(formattedEmTrend);

        const formattedCrTrend = crData.map((d: any) => ({
          month: `${monthNames[(d.month - 1) % 12]} ${d.year}`,
          credits: d.total_credits,
        }));
        setCreditTrend(formattedCrTrend);
        
        setRecentPredictions(predData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const columns: Column<Prediction>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono text-dark-500">#{row.id}</span>,
    },
    {
      header: 'Facility Name',
      accessorKey: 'facility_name',
    },
    {
      header: 'Country',
      accessorKey: 'country',
      cell: (row) => <span>{row.country || 'Unknown'}</span>,
    },
    {
      header: 'Predicted (t CO₂)',
      accessorKey: 'predicted_emission',
      cell: (row) => <span className="font-semibold">{formatNumber(row.predicted_emission)}</span>,
    },
    {
      header: 'Date Created',
      accessorKey: 'created_at',
      cell: (row) => <span>{formatDate(row.created_at, true)}</span>,
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/reports?prediction=${row.id}`)}
          className="h-8 py-0 px-2 text-xs"
        >
          View Report
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
            Carbon Dashboard
          </h1>
          <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
            Real-time analytics and predictive insights for carbon credit compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <Button
              variant="outline"
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-accent-500" />
              <span>Admin Console</span>
            </Button>
          )}
          <Button
            onClick={() => navigate('/predict')}
            className="flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            <span>Run Prediction</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Predictions"
          value={overview ? formatCompactNumber(overview.total_predictions, 0) : '0'}
          icon={<Cpu className="w-5 h-5" />}
          description="Total predictions logged in system"
          loading={loading}
        />
        <StatCard
          title="Total Emissions"
          value={overview ? `${formatCompactNumber(overview.total_emissions_tco2 || (overview as any).total_emissions, 2)} t` : '0 t'}
          icon={<Leaf className="w-5 h-5" />}
          description="Predicted CO₂ tonnage across plants"
          loading={loading}
          trend={{ value: 4.2, direction: 'down' }}
        />
        <StatCard
          title="Credits Earned"
          value={overview ? formatCompactNumber(overview.total_credits_generated || (overview as any).total_credits, 2) : '0'}
          icon={<Coins className="w-5 h-5" />}
          description="Carbon credits offset computed"
          loading={loading}
          trend={{ value: 12.8, direction: 'up' }}
        />
        <StatCard
          title="Average Efficiency"
          value="18.5%"
          icon={<FileSpreadsheet className="w-5 h-5" />}
          description="Reduction from baseline averages"
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emissions Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Emissions Forecasting Trend</CardTitle>
            <CardDescription>Predicted carbon emissions in tonnes CO₂ over historical runs</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <span className="text-sm text-dark-450 animate-pulse">Loading trend chart...</span>
              </div>
            ) : emissionsTrend.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center border border-dashed rounded-xl">
                <span className="text-xs text-dark-400">Run predictions to populate forecasting chart.</span>
              </div>
            ) : (
              <EmissionTrendChart data={emissionsTrend} />
            )}
          </CardContent>
        </Card>

        {/* Credit Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Carbon Credits Accumulation</CardTitle>
            <CardDescription>Offset credits computed against baseline emission criteria</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <span className="text-sm text-dark-450 animate-pulse">Loading credits chart...</span>
              </div>
            ) : creditTrend.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center border border-dashed rounded-xl">
                <span className="text-xs text-dark-400">Verify carbon credits to display accumulation chart.</span>
              </div>
            ) : (
              <CreditTrendChart data={creditTrend} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Predictions</CardTitle>
            <CardDescription>Overview of your recently computed carbon emission predictions</CardDescription>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            <span>View all reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={recentPredictions}
            loading={loading}
            pageSize={5}
          />
        </CardContent>
      </Card>
    </div>
  );
};
export default DashboardPage;
