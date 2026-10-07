import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../services/api/dashboardApi';
import { CountryAnalytic, EmissionTrendPoint, CreditTrendPoint } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { CountryBarChart } from '../../components/charts/CountryBarChart';
import { AreaChart, AreaConfig } from '../../components/charts/AreaChart';
import { DonutChart, DonutChartData } from '../../components/charts/DonutChart';
import { formatNumber } from '../../utils/helpers';
import { BarChart3, Globe, LineChart, PieChart, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AnalyticsPage: React.FC = () => {
  const [countriesData, setCountriesData] = useState<CountryAnalytic[]>([]);
  const [combinedTrend, setCombinedTrend] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<DonutChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'geo' | 'trend'>('geo');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [countries, emissions, credits] = await Promise.all([
        dashboardApi.getCountries(),
        dashboardApi.getEmissionsTrend(),
        dashboardApi.getCreditTrend(),
      ]);

      // Map emissions fields to match total_emissions schema mapping
      const formattedCountries = countries.map((c: any) => ({
        ...c,
        total_emissions: c.total_emissions || c.emissions,
      }));

      setCountriesData(formattedCountries);

      // Distribute emissions for Donut Chart
      const dist = formattedCountries.map((c) => ({
        name: c.country,
        value: c.total_emissions,
      }));
      setDistributionData(dist);

      // Merge emissions and credits trends into a single time series
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mergedMap: Record<string, { month: string; emissions: number; credits: number }> = {};

      emissions.forEach((em: any) => {
        const key = `${em.year}-${String(em.month).padStart(2, '0')}`;
        mergedMap[key] = {
          month: `${monthNames[(em.month - 1) % 12]} ${em.year}`,
          emissions: em.total_emissions,
          credits: 0,
        };
      });

      credits.forEach((cr: any) => {
        const key = `${cr.year}-${String(cr.month).padStart(2, '0')}`;
        if (mergedMap[key]) {
          mergedMap[key].credits = cr.total_credits;
        } else {
          mergedMap[key] = {
            month: `${monthNames[(cr.month - 1) % 12]} ${cr.year}`,
            emissions: 0,
            credits: cr.total_credits,
          };
        }
      });

      const trendSortedList = Object.keys(mergedMap)
        .sort()
        .map((k) => mergedMap[k]);

      setCombinedTrend(trendSortedList);
    } catch (err) {
      console.error('Failed to load analytics charts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const columns: Column<CountryAnalytic>[] = [
    {
      header: 'Country / Jurisdiction',
      accessorKey: 'country',
      sortable: true,
    },
    {
      header: 'Predictions Run',
      accessorKey: 'facility_count',
      cell: (row) => <span>{formatNumber(row.facility_count || 1)} runs</span>,
      sortable: true,
    },
    {
      header: 'Total Predicted Emissions',
      accessorKey: 'total_emissions',
      cell: (row) => <span className="font-semibold">{formatNumber(row.total_emissions || (row as any).emissions)} t CO₂</span>,
      sortable: true,
    },
    {
      header: 'Credits Issued',
      accessorKey: 'credits',
      cell: (row) => <span className="font-semibold text-emerald-600 dark:text-emerald-450">{formatNumber(row.credits)} credits</span>,
      sortable: true,
    },
  ];

  const trendAreas: AreaConfig[] = [
    { key: 'emissions', color: '#4ADE80', name: 'Emissions (t CO₂)' },
    { key: 'credits', color: '#38BDF8', name: 'Credits Issued' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
            Deep-Dive Analytics
          </h1>
          <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
            Global jurisdiction insights, emission ratios, and offsets accumulation over time.
          </p>
        </div>
        <Button variant="outline" onClick={fetchAnalytics} className="flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>Sync Data</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-dark-100 dark:bg-dark-900 rounded-2xl max-w-sm select-none border border-dark-200/50 dark:border-dark-800/60">
        <button
          onClick={() => setActiveTab('geo')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'geo'
              ? 'bg-white dark:bg-dark-800 text-dark-900 dark:text-white shadow-md'
              : 'text-dark-500 dark:text-dark-400 hover:text-dark-800 dark:hover:text-dark-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Jurisdictional Map</span>
        </button>
        <button
          onClick={() => setActiveTab('trend')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'trend'
              ? 'bg-white dark:bg-dark-800 text-dark-900 dark:text-white shadow-md'
              : 'text-dark-500 dark:text-dark-400 hover:text-dark-800 dark:hover:text-dark-200'
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Timeline Analytics</span>
        </button>
      </div>

      {/* Dynamic Tab Render */}
      {activeTab === 'geo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Country Bar Chart Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Geographical Emissions Breakdown</CardTitle>
              <CardDescription>Jurisdiction-level cumulative tonnage predicted by the model</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <span className="text-sm text-dark-450 animate-pulse">Computing charts...</span>
                </div>
              ) : countriesData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center border border-dashed rounded-xl">
                  <span className="text-xs text-dark-400">No geographical records available yet.</span>
                </div>
              ) : (
                <CountryBarChart data={countriesData} />
              )}
            </CardContent>
          </Card>

          {/* Donut Chart Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Ratio Split</CardTitle>
              <CardDescription>Emissions distribution percentage by country</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <span className="text-sm text-dark-450 animate-pulse">Preparing distribution...</span>
                </div>
              ) : distributionData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center border border-dashed rounded-xl">
                  <span className="text-xs text-dark-400">No items available.</span>
                </div>
              ) : (
                <DonutChart data={distributionData} />
              )}
            </CardContent>
          </Card>

          {/* Jurisdictions Data Table */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Regional Operations Detailed Registry</CardTitle>
              <CardDescription>Granular summary of predicted outputs and credit emission indicators per region.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={countriesData} loading={loading} pageSize={5} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="animate-in fade-in duration-200">
          <CardHeader>
            <CardTitle>Accumulative compliance trends</CardTitle>
            <CardDescription>Emissions output compared to carbon offset credits issued over historical timeline</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <span className="text-sm text-dark-450 animate-pulse">Compiling timeline metrics...</span>
              </div>
            ) : combinedTrend.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center border border-dashed rounded-xl">
                <span className="text-xs text-dark-400">No chronological predictions logged.</span>
              </div>
            ) : (
              <AreaChart
                data={combinedTrend}
                xKey="month"
                areas={trendAreas}
                height={350}
                yTickFormatter={(v) => `${formatNumber(v / 1000)}k`}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default AnalyticsPage;
