import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { predictionApi } from '../../services/api/predictionApi';
import { carbonCreditApi } from '../../services/api/carbonCreditApi';
import { reportApi } from '../../services/api/reportApi';
import { Prediction, CarbonCredit, Report } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { formatNumber, formatDate } from '../../utils/helpers';
import { Cpu, Leaf, Coins, FileText, ArrowLeft, CheckCircle2, ChevronRight, Loader2, Sparkles } from 'lucide-react';

export const PredictionResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [carbonCredits, setCarbonCredits] = useState<CarbonCredit | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const predictionId = Number(searchParams.get('id'));

  useEffect(() => {
    const fetchPrediction = async () => {
      // 1. Check if prediction passed in route state
      if (location.state && location.state.prediction) {
        setPrediction(location.state.prediction);
        setLoading(false);
        return;
      }

      // 2. Fetch recent user predictions list and locate prediction
      try {
        setLoading(true);
        if (predictionId) {
          const preds = await predictionApi.listUserPredictions(0, 100);
          const matched = preds.find((p) => p.id === predictionId);
          if (matched) {
            setPrediction(matched);
          } else {
            console.error('Prediction not found in user list');
          }
        }
      } catch (err) {
        console.error('Failed to load prediction details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [predictionId, location.state]);

  const handleComputeCredits = async () => {
    if (!prediction || !prediction.baseline_emission) return;
    try {
      setCreditsLoading(true);
      const credits = await carbonCreditApi.computeCredits({
        prediction_id: prediction.id,
        baseline_emission: prediction.baseline_emission,
      });
      setCarbonCredits(credits);
    } catch (err) {
      console.error('Failed to compute credits:', err);
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!prediction) return;
    try {
      setReportLoading(true);
      const generated = await reportApi.generateReport({
        prediction_id: prediction.id,
        report_type: 'facility',
      });
      setReport(generated);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <span className="text-sm text-dark-500 animate-pulse">Retrieving inference records...</span>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="text-center py-16 space-y-4 max-w-sm mx-auto">
        <h2 className="text-xl font-bold text-dark-900 dark:text-white">Record Not Found</h2>
        <p className="text-xs text-dark-400">The prediction record you requested could not be found. It may have been deleted.</p>
        <Button onClick={() => navigate('/predict')} className="w-full">
          Back to Inference Engine
        </Button>
      </div>
    );
  }

  const reductionPercent = prediction.baseline_emission
    ? ((prediction.baseline_emission - prediction.predicted_emission) / prediction.baseline_emission) * 100
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      {/* Back button */}
      <button
        onClick={() => navigate('/predict')}
        className="flex items-center gap-1.5 text-xs font-semibold text-dark-500 hover:text-dark-900 dark:text-dark-400 dark:hover:text-dark-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Inference Engine</span>
      </button>

      {/* Main Result Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tonnage Display */}
        <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-primary-400/10 via-white to-secondary-300/5 dark:from-primary-950/20 dark:via-dark-900 dark:to-dark-950/40">
          <div className="absolute top-2 right-2 p-1.5 bg-primary-100 dark:bg-primary-900/50 rounded-xl text-primary-600 dark:text-primary-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <CardHeader>
            <CardTitle>Forecast Result</CardTitle>
            <CardDescription>{prediction.facility_name} • {prediction.country || 'Global'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider block">
                Predicted Emissions Quantity
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-dark-900 dark:text-white tracking-tight">
                  {formatNumber(prediction.predicted_emission, 2)}
                </span>
                <span className="text-lg font-bold text-dark-500">t CO₂</span>
              </div>
            </div>

            {/* Latitude/Longitude Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-dark-50 dark:bg-dark-950/30 rounded-2xl border border-dark-200/50 dark:border-dark-800/40">
              <div>
                <span className="block text-[10px] font-semibold text-dark-400 dark:text-dark-500 uppercase">Timestamp</span>
                <span className="text-xs font-bold text-dark-800 dark:text-dark-200">
                  {formatDate(prediction.created_at, true)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-dark-400 dark:text-dark-500 uppercase">Inference Engine</span>
                <span className="text-xs font-bold text-dark-800 dark:text-dark-200 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-primary-500" />
                  <span>BiLSTM Keras</span>
                </span>
              </div>
            </div>

            {/* Baseline comparison if available */}
            {prediction.baseline_emission && (
              <div className="space-y-3 pt-4 border-t border-dark-200/50 dark:border-dark-800/40">
                <h4 className="text-xs font-bold text-dark-900 dark:text-white">Baseline Comparison</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-dark-550 dark:text-dark-400">
                    <span>Forecast: {formatNumber(prediction.predicted_emission)} t</span>
                    <span>Baseline: {formatNumber(prediction.baseline_emission)} t</span>
                  </div>
                  <div className="w-full h-3 bg-dark-200 dark:bg-dark-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-primary-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, Math.min(95, (prediction.predicted_emission / prediction.baseline_emission) * 100))}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Leaf className="w-4 h-4" />
                    <span>
                      {reductionPercent > 0
                        ? `Reduction of ${formatNumber(reductionPercent, 1)}% from baseline standards.`
                        : `Exceeds baseline threshold by ${formatNumber(Math.abs(reductionPercent), 1)}%.`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Actions (Credits, PDF Report) */}
        <div className="space-y-6">
          
          {/* Carbon Credit Calculator Card */}
          {prediction.baseline_emission && (
            <Card className="border border-dark-200/60 dark:border-dark-800/60">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-500">
                    <Coins className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-base">Carbon Offsets</CardTitle>
                </div>
                <CardDescription>Compute credit incentives for this prediction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!carbonCredits ? (
                  <Button
                    onClick={handleComputeCredits}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10 flex justify-center items-center gap-2"
                    disabled={creditsLoading}
                  >
                    {creditsLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Computing credits...</span>
                      </>
                    ) : (
                      <>
                        <span>Compute Carbon Credits</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/15 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                      <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Incentive Credits Issued
                      </span>
                      <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 block mt-1 tracking-tight">
                        {formatNumber(carbonCredits.carbon_credits, 2)}
                      </span>
                      <span className="text-[10px] text-dark-500 dark:text-dark-400 block mt-2">
                        Formula: max(0, baseline − predicted)
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-dark-500 dark:text-dark-400">
                      <div className="flex justify-between">
                        <span>Net Reduction:</span>
                        <span className="font-semibold text-dark-800 dark:text-dark-250">
                          {formatNumber(carbonCredits.reduction, 2)} t CO₂
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Issued ID:</span>
                        <span className="font-mono text-dark-800 dark:text-dark-250">
                          #CRED-{carbonCredits.id}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compliance Report Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-50 dark:bg-primary-950/20 rounded-lg text-primary-600 dark:text-primary-400">
                  <FileText className="w-4 h-4" />
                </div>
                <CardTitle className="text-base">Compliance PDF</CardTitle>
              </div>
              <CardDescription>Generate auditable audit-ready PDF reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!report ? (
                <Button
                  onClick={handleGenerateReport}
                  className="w-full flex justify-center items-center gap-2"
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate PDF Report</span>
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-3 bg-primary-50/50 dark:bg-primary-950/10 rounded-2xl border border-primary-100 dark:border-primary-900/30 text-xs flex gap-3 items-center">
                    <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />
                    <div>
                      <p className="font-bold text-primary-700 dark:text-primary-400">PDF Available</p>
                      <p className="text-[10px] text-dark-500 dark:text-dark-400">Compliance file compiled from Jinja2 templates.</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/reports?preview=${report.id}`)}
                    className="w-full flex justify-center items-center gap-2"
                  >
                    <span>View & Download Report</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default PredictionResult;
