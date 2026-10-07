import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi, UserGrowthPoint, PredictionStat, TopFacility, ReportStats } from '../../services/api/analyticsApi';
import { userApi } from '../../services/api/userApi';
import { ModelMetrics } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CreditTrendChart } from '../../components/charts/CreditTrendChart'; // Can reuse standard LineChart style
import { DonutChart } from '../../components/charts/DonutChart';
import { formatNumber, formatCompactNumber } from '../../utils/helpers';
import { Users, Cpu, FileText, Activity, UsersRound, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([]);
  const [predictionStats, setPredictionStats] = useState<PredictionStat | any>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | any>(null);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [topFacilities, setTopFacilities] = useState<TopFacility[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const [uGrowth, pStats, mMetrics, rStats, tFacs, usersList] = await Promise.all([
        analyticsApi.getUserGrowth(),
        analyticsApi.getPredictionStats(),
        analyticsApi.getModelMetrics(),
        analyticsApi.getReportStats(),
        analyticsApi.getTopFacilities(5),
        userApi.listUsers(0, 1),
      ]);

      setUserGrowth(uGrowth);
      setPredictionStats(pStats);
      setModelMetrics(mMetrics);
      setReportStats(rStats);
      setTopFacilities(tFacs);
      setTotalUsersCount(usersList.total);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  // Format user growth data for LineChart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedUserGrowth = userGrowth.map((g) => ({
    month: `${monthNames[(g.month - 1) % 12]} ${g.year}`,
    credits: g.new_users || 0, // Using credits parameter mapping of LineChart for simplicity
  }));

  // Format report ratios for donut chart
  const reportRatios = reportStats
    ? Object.keys(reportStats.by_type).map((k) => ({
        name: `${k.charAt(0).toUpperCase() + k.slice(1)} Report`,
        value: reportStats.by_type[k],
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
            Admin Metrics Console
          </h1>
          <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
            Analyze platform-wide statistics, users growth, model load performance, and audits.
          </p>
        </div>
        
        <div className="flex items-center gap-2 select-none self-start sm:self-auto">
          <Button variant="outline" onClick={fetchAdminStats} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Sync Console</span>
          </Button>
          <Button onClick={() => navigate('/admin/users')} className="flex items-center gap-2">
            <UsersRound className="w-4 h-4" />
            <span>Manage Users</span>
          </Button>
        </div>
      </div>

      {/* Admin KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Platform Users"
          value={formatCompactNumber(totalUsersCount, 0)}
          icon={<Users className="w-5 h-5" />}
          description="Registered profiles in databases"
          loading={loading}
        />
        <StatCard
          title="Total Model Inferences"
          value={modelMetrics ? formatCompactNumber(modelMetrics.total_inference_calls, 0) : '0'}
          icon={<Cpu className="w-5 h-5" />}
          description="BiLSTM engine active calculations"
          loading={loading}
        />
        <StatCard
          title="Average Emissions"
          value={predictionStats ? `${formatCompactNumber(predictionStats.avg_emission, 2)} t` : '0 t'}
          icon={<Activity className="w-5 h-5" />}
          description="Mean carbon quantity per run"
          loading={loading}
        />
        <StatCard
          title="Reports Generated"
          value={reportStats ? formatCompactNumber(reportStats.total_reports, 0) : '0'}
          icon={<FileText className="w-5 h-5" />}
          description="Total Jinja compliance PDFs compiled"
          loading={loading}
        />
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Growth Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Accrual Dynamics</CardTitle>
            <CardDescription>Number of registered user profiles created over months</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <span className="text-sm text-dark-450 animate-pulse">Analyzing user growth...</span>
              </div>
            ) : formattedUserGrowth.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center border border-dashed rounded-xl">
                <span className="text-xs text-dark-400">No user growth records logged.</span>
              </div>
            ) : (
              // Reusing credit trend line chart structure for user growth
              <CreditTrendChart data={formattedUserGrowth} />
            )}
          </CardContent>
        </Card>

        {/* Report Types Distribution Donut */}
        <Card>
          <CardHeader>
            <CardTitle>PDF Audits Ratio</CardTitle>
            <CardDescription>Compliance report distribution split by type</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <span className="text-sm text-dark-450 animate-pulse">Retrieving audit formats...</span>
              </div>
            ) : reportRatios.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center border border-dashed rounded-xl">
                <span className="text-xs text-dark-400">No reports generated on platform.</span>
              </div>
            ) : (
              <DonutChart data={reportRatios} />
            )}
          </CardContent>
        </Card>

      </div>

      {/* Bottom Block: Top Facilities and quick logs links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Facilities Cumulative Emissions */}
        <Card>
          <CardHeader>
            <CardTitle>Highest Emitter Facilities</CardTitle>
            <CardDescription>Cumulative emissions predicted per plant location (Top 5)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-dark-100 dark:border-dark-800">
                  <div className="w-[40%] h-4.5 bg-dark-200 dark:bg-dark-800 rounded animate-pulse"></div>
                  <div className="w-[20%] h-4.5 bg-dark-200 dark:bg-dark-800 rounded animate-pulse"></div>
                </div>
              ))
            ) : topFacilities.length === 0 ? (
              <div className="text-center py-6 text-xs text-dark-450">No facility predictions logged.</div>
            ) : (
              topFacilities.map((f, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-800/80 last:border-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-dark-400 font-mono">0{index + 1}</span>
                    <span className="text-sm font-semibold text-dark-800 dark:text-dark-200 truncate max-w-[180px]">
                      {f.facility_name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-dark-900 dark:text-white">
                    {formatNumber(f.total_emissions)} t CO₂
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Audit Logs Box */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Security Audit logs</CardTitle>
            <CardDescription>Track user log-ins, registrations, and account closures in real time.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-dark-500 dark:text-dark-400 leading-relaxed">
            Every administrative action, registry change, user registration, and system login event is securely audited with timestamp logs and origin client IP tracking.
          </CardContent>
          <CardFooter className="pt-0 select-none">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/logs')}
              className="w-full flex items-center justify-center gap-1.5"
            >
              <span>Inspect Audit Logs registry</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
};
export default AdminDashboardPage;
