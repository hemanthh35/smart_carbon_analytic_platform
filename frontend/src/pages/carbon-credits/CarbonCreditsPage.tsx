import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { carbonCreditApi } from '../../services/api/carbonCreditApi';
import { predictionApi } from '../../services/api/predictionApi';
import { dashboardApi } from '../../services/api/dashboardApi';
import { CarbonCreditDetails, CreditTrendPoint, Prediction } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { CreditTrendChart } from '../../components/charts/CreditTrendChart';
import { formatNumber, formatDate, formatCompactNumber } from '../../utils/helpers';
import { Coins, Leaf, Cpu, Plus, FileText, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export const CarbonCreditsPage: React.FC = () => {
  const navigate = useNavigate();
  const [credits, setCredits] = useState<CarbonCreditDetails[]>([]);
  const [creditTrend, setCreditTrend] = useState<CreditTrendPoint[]>([]);
  const [pendingPredictions, setPendingPredictions] = useState<Prediction[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [baselineInput, setBaselineInput] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [dialogSubmitting, setDialogSubmitting] = useState(false);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const [creditsData, trendData, allPredictions] = await Promise.all([
        carbonCreditApi.listCredits(),
        dashboardApi.getCreditTrend(),
        predictionApi.listUserPredictions(0, 100),
      ]);

      setCredits(creditsData);

      // Format credit trend month labels
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedTrend = trendData.map((d: any) => ({
        month: `${monthNames[(d.month - 1) % 12]} ${d.year}`,
        credits: d.total_credits,
      }));
      setCreditTrend(formattedTrend);

      // Filter predictions that do NOT have a carbon credit computed yet
      const computedPredictionIds = new Set(creditsData.map((c) => c.prediction_id));
      const pending = allPredictions.filter((p) => !computedPredictionIds.has(p.id));
      setPendingPredictions(pending);
    } catch (err) {
      console.error('Failed to load carbon credits page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  // Compute credits handler for predictions with pre-existing baseline
  const handleDirectCompute = async (prediction: Prediction) => {
    if (!prediction.baseline_emission) return;
    try {
      setActionLoading(prediction.id);
      await carbonCreditApi.computeCredits({
        prediction_id: prediction.id,
        baseline_emission: prediction.baseline_emission,
      });
      await fetchPageData();
    } catch (err) {
      console.error('Failed to compute carbon credits directly:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Dialog actions
  const openComputeDialog = (prediction: Prediction) => {
    setSelectedPrediction(prediction);
    setBaselineInput(prediction.baseline_emission ? String(prediction.baseline_emission) : '');
    setDialogError('');
    setIsDialogOpen(true);
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrediction) return;

    const baseline = parseFloat(baselineInput);
    if (isNaN(baseline) || baseline <= 0) {
      setDialogError('Baseline emission must be a positive number greater than 0.');
      return;
    }

    try {
      setDialogSubmitting(true);
      await carbonCreditApi.computeCredits({
        prediction_id: selectedPrediction.id,
        baseline_emission: baseline,
      });
      setIsDialogOpen(false);
      await fetchPageData();
    } catch (err: any) {
      setDialogError(err.response?.data?.detail || 'Failed to compute carbon credits. Please try again.');
    } finally {
      setDialogSubmitting(false);
    }
  };

  // KPI calculations
  const totalCredits = credits.reduce((sum, c) => sum + c.carbon_credits, 0);
  const totalReduction = credits.reduce((sum, c) => sum + c.reduction, 0);
  const avgOffset = credits.length > 0 ? totalCredits / credits.length : 0;
  const activePlantsCount = new Set(credits.map((c) => c.prediction?.facility_name)).size;

  const logColumns: Column<CarbonCreditDetails>[] = [
    {
      header: 'Credit ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono text-dark-500">#CRED-{row.id}</span>,
      sortable: true,
    },
    {
      header: 'Facility',
      accessorKey: 'facility_name',
      cell: (row) => <span>{row.prediction?.facility_name || 'Unknown'}</span>,
    },
    {
      header: 'Country',
      accessorKey: 'country',
      cell: (row) => <span>{row.prediction?.country || 'Global'}</span>,
    },
    {
      header: 'Baseline (t)',
      accessorKey: 'baseline_emission',
      cell: (row) => <span>{formatNumber(row.baseline_emission, 2)}</span>,
      sortable: true,
    },
    {
      header: 'Forecasted (t)',
      accessorKey: 'predicted_emission',
      cell: (row) => <span>{formatNumber(row.predicted_emission, 2)}</span>,
      sortable: true,
    },
    {
      header: 'Reduction (t)',
      accessorKey: 'reduction',
      cell: (row) => (
        <span className={row.reduction > 0 ? 'text-primary-600 font-semibold' : 'text-dark-500'}>
          {formatNumber(row.reduction, 2)}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Credits Earned',
      accessorKey: 'carbon_credits',
      cell: (row) => (
        <span className="text-primary-600 font-bold bg-primary-50 dark:bg-primary-950/20 px-2.5 py-0.5 rounded-full">
          +{formatNumber(row.carbon_credits, 2)}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Date Issued',
      accessorKey: 'created_at',
      cell: (row) => <span>{formatDate(row.created_at, true)}</span>,
      sortable: true,
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/reports?prediction=${row.prediction_id}`)}
          className="h-8 py-0 px-2 text-xs flex items-center gap-1"
        >
          <FileText className="w-3 h-3" />
          <span>Report</span>
        </Button>
      ),
    },
  ];

  const pendingColumns: Column<Prediction>[] = [
    {
      header: 'Prediction ID',
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
      cell: (row) => <span>{row.country || 'Global'}</span>,
    },
    {
      header: 'Forecasted (t CO₂)',
      accessorKey: 'predicted_emission',
      cell: (row) => <span className="font-semibold">{formatNumber(row.predicted_emission, 2)}</span>,
    },
    {
      header: 'Baseline (t CO₂)',
      accessorKey: 'baseline_emission',
      cell: (row) => (
        <span>{row.baseline_emission ? formatNumber(row.baseline_emission, 2) : 'Not Configured'}</span>
      ),
    },
    {
      header: 'Action',
      accessorKey: 'actions',
      cell: (row) => {
        const isSubmitting = actionLoading === row.id;
        if (row.baseline_emission) {
          return (
            <Button
              size="sm"
              onClick={() => handleDirectCompute(row)}
              disabled={isSubmitting}
              className="h-8 text-xs bg-primary-500 hover:bg-primary-600 text-white flex items-center gap-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Coins className="w-3.5 h-3.5" />
              )}
              <span>Compute Offsets</span>
            </Button>
          );
        }
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openComputeDialog(row)}
            className="h-8 text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-primary-500" />
            <span>Set Baseline & Compute</span>
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
            Carbon Credits Portal
          </h1>
          <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
            Calculate, track, and manage environmental offset credit incentives compiled from prediction models.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/predict')} className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <span>Inference Engine</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Credits Issued"
          value={loading ? '0.00' : formatCompactNumber(totalCredits, 2)}
          icon={<Coins className="w-5 h-5" />}
          description="Environment credits computed and verified"
          loading={loading}
        />
        <StatCard
          title="Net Carbon Reduction"
          value={loading ? '0.00 t' : `${formatCompactNumber(totalReduction, 2)} t`}
          icon={<Leaf className="w-5 h-5" />}
          description="Tonnage reduction compared to standard base"
          loading={loading}
        />
        <StatCard
          title="Average Credit Weight"
          value={loading ? '0.00' : formatCompactNumber(avgOffset, 2)}
          icon={<Sparkles className="w-5 h-5" />}
          description="Average credits generated per run"
          loading={loading}
        />
        <StatCard
          title="Active Facilities"
          value={loading ? '0' : activePlantsCount}
          icon={<FileText className="w-5 h-5" />}
          description="Facilities with incentive distributions"
          loading={loading}
        />
      </div>

      {/* Chart & Pending Calculations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accumulation Chart (Left/Span 2) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Credit Accumulation Trend</CardTitle>
            <CardDescription>Aggregate monthly credits issued to date</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : creditTrend.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center border border-dashed rounded-xl">
                <span className="text-xs text-dark-400">Compute offsets to populate credit accumulation graph.</span>
              </div>
            ) : (
              <CreditTrendChart data={creditTrend} />
            )}
          </CardContent>
        </Card>

        {/* Info panel / quick tip (Right/Span 1) */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary-400/5 via-white to-secondary-300/5 dark:from-primary-950/10 dark:via-dark-900 dark:to-dark-950/20 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-base">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>How offset computation works</span>
            </CardTitle>
            <CardDescription>Rules & formula details</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-dark-500 dark:text-dark-400 space-y-3 flex-1">
            <p>
              Carbon credits are designed to incentivize facilities to emit less than standard regulated baseline thresholds.
            </p>
            <div className="p-3 bg-dark-50 dark:bg-dark-950/30 rounded-xl space-y-1.5 border">
              <div className="font-semibold text-dark-800 dark:text-dark-250">
                1 Credit = 1 Tonne of CO₂ prevented.
              </div>
              <div className="font-mono text-2xs text-primary-600 dark:text-primary-400">
                Formula: max(0, Baseline - Prediction)
              </div>
            </div>
            <p>
              If a facility's forecasted emissions exceed baseline standards, the net reduction is negative, and 0 credits are issued.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Calculations Section */}
      {pendingPredictions.length > 0 && (
        <Card className="border border-amber-250/20 dark:border-amber-900/10 bg-amber-500/[0.01]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-100 dark:bg-amber-950/35 rounded-lg text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Verification Queue ({pendingPredictions.length})</CardTitle>
                <CardDescription>Predictions pending credit computation. Input base thresholds to resolve offsets.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={pendingColumns}
              data={pendingPredictions}
              loading={loading}
              pageSize={5}
            />
          </CardContent>
        </Card>
      )}

      {/* Credit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Offset Transaction Log</CardTitle>
          <CardDescription>Comprehensive audit record of environmental offsets generated by your predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={logColumns}
            data={credits}
            loading={loading}
            searchKey="id"
            searchPlaceholder="Search by Credit ID..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Dialog Modal for setting baseline and computing credits */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Compute Offset Incentive"
        description={`Configure standard baseline emission parameter for facility "${selectedPrediction?.facility_name}"`}
      >
        <form onSubmit={handleDialogSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-dark-500 uppercase">
              Baseline Emission limit (t CO₂)
            </label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 5000.00"
              value={baselineInput}
              onChange={(e) => setBaselineInput(e.target.value)}
              required
              disabled={dialogSubmitting}
            />
            <p className="text-[10px] text-dark-400">
              The historical baseline limit standard for this facility type and production capacity.
            </p>
          </div>

          {selectedPrediction && (
            <div className="p-3 bg-dark-50 dark:bg-dark-950/20 rounded-xl border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-dark-500">Forecasted Emission:</span>
                <span className="font-semibold text-dark-900 dark:text-white">
                  {formatNumber(selectedPrediction.predicted_emission, 2)} t CO₂
                </span>
              </div>
            </div>
          )}

          {dialogError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/15 rounded-xl text-red-650 dark:text-red-400 border border-red-200/50 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{dialogError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              disabled={dialogSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={dialogSubmitting} className="bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/10">
              {dialogSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Calculating...</span>
                </>
              ) : (
                <span>Compute Credits</span>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default CarbonCreditsPage;
