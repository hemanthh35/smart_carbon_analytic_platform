import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store/store';
import { Button } from '../components/ui/Button';
import { predictionApi } from '../services/api/predictionApi';
import { formatCompactNumber } from '../utils/helpers';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Database,
  FileCheck2,
  Gauge,
  Leaf,
  Menu,
  MoveUpRight,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

type TechType = 'BF' | 'DRI' | 'EAF';

const techMultipliers: Record<TechType, { factor: number; baseline: number; name: string; note: string }> = {
  BF: { factor: 1.85, baseline: 2.1, name: 'Blast furnace', note: 'Coal-based route' },
  DRI: { factor: 1.15, baseline: 1.4, name: 'Direct reduced iron', note: 'Gas-based route' },
  EAF: { factor: 0.45, baseline: 0.7, name: 'Electric arc furnace', note: 'Electric route' },
};

const formatMetric = (value: number) => formatCompactNumber(value, value >= 1000000 ? 1 : 0);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    total_facilities: 953,
    total_countries: 81,
    total_emissions_tracked: 12323563120,
    total_credits_issued: 0,
    total_predictions: 0,
  });
  const [capacity, setCapacity] = useState(250000);
  const [utilization, setUtilization] = useState(80);
  const [techType, setTechType] = useState<TechType>('BF');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await predictionApi.getPublicStats();
        setStats({
          total_facilities: data.total_facilities,
          total_countries: data.total_countries,
          total_emissions_tracked: data.total_emissions_tracked,
          total_credits_issued: data.total_credits_issued,
          total_predictions: data.total_predictions,
        });
      } catch (error) {
        console.error('Failed to fetch public stats:', error);
      }
    };

    fetchStats();
  }, []);

  const selectedTech = techMultipliers[techType];
  const modelOutput = useMemo(() => {
    const baseline = capacity * selectedTech.baseline;
    const predicted = capacity * (utilization / 100) * selectedTech.factor;
    const reduction = Math.max(0, baseline - predicted);
    return {
      baseline,
      predicted,
      reduction,
      credits: Math.round(reduction),
      value: Math.round(reduction * 28.5),
      ratio: Math.min(100, Math.max(8, (predicted / baseline) * 100)),
    };
  }, [capacity, selectedTech, utilization]);

  const handleAnchorClick = () => setMenuOpen(false);

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-container landing-nav__inner">
          <button className="landing-brand" onClick={() => navigate('/')} aria-label="Pulse Carbon home">
            <span className="landing-brand__mark"><Leaf size={17} strokeWidth={2.3} /></span>
            <span>Pulse<span>Carbon</span></span>
          </button>

          <nav className={`landing-nav__links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <a href="#platform" onClick={handleAnchorClick}>Platform</a>
            <a href="#method" onClick={handleAnchorClick}>Method</a>
            <a href="#simulator" onClick={handleAnchorClick}>Simulator</a>
            <a href="#coverage" onClick={handleAnchorClick}>Coverage</a>
          </nav>

          <div className="landing-nav__actions">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} size="sm" className="landing-nav__workspace">
                Open workspace <ArrowRight size={14} />
              </Button>
            ) : (
              <>
                <button className="landing-text-button landing-text-button--desktop" onClick={() => navigate('/login')}>Sign in</button>
                <Button onClick={() => navigate('/register')} size="sm" className="landing-nav__workspace">
                  Start free <ArrowRight size={14} />
                </Button>
              </>
            )}
            <button className="landing-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero__grid">
            <div className="landing-hero__copy">
              <div className="landing-kicker"><span className="landing-kicker__dot" /> Industrial emissions intelligence</div>
              <h1>Make the next <em>reduction</em> measurable.</h1>
              <p className="landing-hero__lede">
                Pulse Carbon turns facility-level data into defensible forecasts, audit-ready evidence, and a clearer path to lower emissions.
              </p>
              <div className="landing-hero__actions">
                <Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')} size="lg">
                  {isAuthenticated ? 'Open workspace' : 'Explore the workspace'} <ArrowRight size={17} />
                </Button>
                <a className="landing-play-link" href="#method"><span className="landing-play-link__icon"><Play size={13} fill="currentColor" /></span> See how it works</a>
              </div>
              <div className="landing-hero__proof">
                <div className="landing-proof-mark"><ShieldCheck size={15} /></div>
                <span>Built for evidence-led climate operations</span>
              </div>
            </div>

            <div className="landing-hero__visual" aria-label="Live emissions monitoring preview">
              <div className="landing-visual-grid" />
              <div className="landing-monitor">
                <div className="landing-monitor__topline">
                  <span><span className="landing-live-dot" /> Model monitor</span>
                  <span className="landing-mono">PC / 04</span>
                </div>
                <div className="landing-monitor__heading">
                  <div>
                    <span className="landing-label">Forecasted output</span>
                    <strong>1.42<span>m</span></strong>
                    <small>tCO₂e / annualized</small>
                  </div>
                  <div className="landing-monitor__delta"><MoveUpRight size={14} /> 12.8% <small>below baseline</small></div>
                </div>
                <div className="landing-chart" aria-hidden="true">
                  <div className="landing-chart__grid" />
                  <svg viewBox="0 0 520 190" preserveAspectRatio="none">
                    <path d="M0 150 C40 148 48 128 82 134 S123 156 157 112 S201 92 234 104 S272 128 308 91 S349 70 382 85 S423 93 454 50 S489 52 520 29" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path d="M0 150 C40 148 48 128 82 134 S123 156 157 112 S201 92 234 104 S272 128 308 91 S349 70 382 85 S423 93 454 50 S489 52 520 29 L520 190 L0 190 Z" fill="currentColor" opacity=".08" />
                  </svg>
                  <div className="landing-chart__axis"><span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Now</span></div>
                </div>
                <div className="landing-monitor__footer">
                  <div><span className="landing-label">Confidence</span><strong>95.2%</strong></div>
                  <div><span className="landing-label">Facilities</span><strong>{stats.total_facilities.toLocaleString()}</strong></div>
                  <div><span className="landing-label">Last sync</span><strong>08:42 <span>UTC</span></strong></div>
                </div>
              </div>
              <div className="landing-float-note landing-float-note--top"><span className="landing-float-note__icon"><Activity size={14} /></span><span><strong>Signal detected</strong><small>Efficiency improving</small></span></div>
              <div className="landing-float-note landing-float-note--bottom"><span className="landing-float-note__icon"><FileCheck2 size={14} /></span><span><strong>Audit trail ready</strong><small>Report generated</small></span></div>
            </div>
          </div>
        </section>

        <section className="landing-metrics" aria-label="Platform metrics">
          <div className="landing-container landing-metrics__inner">
            <span className="landing-metrics__intro">A clearer view of the system</span>
            <div className="landing-metric"><strong>{formatMetric(stats.total_facilities)}</strong><span>facilities mapped</span></div>
            <div className="landing-metric"><strong>{formatMetric(stats.total_countries)}</strong><span>countries covered</span></div>
            <div className="landing-metric"><strong>{formatMetric(stats.total_emissions_tracked)}</strong><span>tCO₂e tracked</span></div>
            <div className="landing-metric"><strong>{formatMetric(stats.total_predictions)}</strong><span>forecasts run</span></div>
          </div>
        </section>

        <section id="platform" className="landing-section landing-section--platform">
          <div className="landing-container">
            <div className="landing-section-intro">
              <div><span className="landing-overline">The platform</span><h2>From raw activity to a decision you can stand behind.</h2></div>
              <p>Climate operations need more than another dashboard. Pulse Carbon brings the context, prediction, and evidence together around the decisions that move your footprint.</p>
            </div>
            <div className="landing-capabilities">
              <article className="landing-capability landing-capability--featured">
                <span className="landing-capability__number">01 / 03</span>
                <div className="landing-capability__icon"><Gauge size={20} /></div>
                <h3>Model the baseline</h3>
                <p>Normalize facility activity, technology, and location into a single operational picture before you make a claim.</p>
                <a href="#simulator">View the model <ArrowRight size={14} /></a>
              </article>
              <article className="landing-capability">
                <span className="landing-capability__number">02 / 03</span>
                <div className="landing-capability__icon"><BarChart3 size={20} /></div>
                <h3>Find the signal</h3>
                <p>Forecast future emissions with a model that makes change visible across time, geography, and plant type.</p>
                <a href="#method">Our method <ArrowRight size={14} /></a>
              </article>
              <article className="landing-capability">
                <span className="landing-capability__number">03 / 03</span>
                <div className="landing-capability__icon"><FileCheck2 size={20} /></div>
                <h3>Prove the result</h3>
                <p>Turn each forecast into an exportable, reviewable record for compliance teams, finance, and auditors.</p>
                <a href="#workspace">See the output <ArrowRight size={14} /></a>
              </article>
            </div>
          </div>
        </section>

        <section id="method" className="landing-method">
          <div className="landing-container landing-method__grid">
            <div className="landing-method__copy"><span className="landing-overline landing-overline--light">A practical workflow</span><h2>Four steps from question to evidence.</h2><p>Keep the operational detail close to the decision. Every run is traceable, repeatable, and ready to share.</p><Button onClick={() => navigate(isAuthenticated ? '/predict' : '/register')} variant="outline" size="lg" className="landing-method__button">Run a forecast <ArrowRight size={16} /></Button></div>
            <div className="landing-steps">
              {[['01', 'Select a facility', 'Start with a known location or browse the mapped facility dataset.'], ['02', 'Add the context', 'Bring in capacity, activity, technology, and baseline emissions.'], ['03', 'Run the forecast', 'Compare predicted output against the baseline and see the variance.'], ['04', 'Export the record', 'Generate a compliance-ready report with the full calculation trail.']].map(([number, title, description]) => (
                <div className="landing-step" key={number}><span className="landing-step__number">{number}</span><div><h3>{title}</h3><p>{description}</p></div><ArrowRight className="landing-step__arrow" size={16} /></div>
              ))}
            </div>
          </div>
        </section>

        <section id="simulator" className="landing-section landing-section--simulator">
          <div className="landing-container">
            <div className="landing-section-intro landing-section-intro--simulator"><div><span className="landing-overline">Try the thinking</span><h2>Make the next move legible.</h2></div><p>Use a simple scenario to see how technology and utilization change the carbon profile of a facility.</p></div>
            <div className="landing-simulator">
              <div className="landing-simulator__controls">
                <div className="landing-simulator__head"><div><span className="landing-overline">Scenario lab</span><h3>Plant assumptions</h3></div><SlidersHorizontal size={19} /></div>
                <label className="landing-field"><span>Production capacity <b>{capacity.toLocaleString()} t / yr</b></span><input type="range" min="50000" max="500000" step="10000" value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} /></label>
                <label className="landing-field"><span>Capacity utilization <b>{utilization}%</b></span><input type="range" min="30" max="100" step="1" value={utilization} onChange={(event) => setUtilization(Number(event.target.value))} /></label>
                <label className="landing-field"><span>Production route</span><span className="landing-select-wrap"><select value={techType} onChange={(event) => setTechType(event.target.value as TechType)}>{Object.entries(techMultipliers).map(([key, value]) => <option key={key} value={key}>{value.name} — {value.note}</option>)}</select><ChevronDown size={15} /></span></label>
                <div className="landing-simulator__note"><Sparkles size={15} /><span>Illustrative scenario. Connect your facility data in the workspace for a verified forecast.</span></div>
              </div>
              <div className="landing-simulator__result">
                <div className="landing-result__top"><div><span className="landing-overline">Estimated output</span><div className="landing-result__value">{Math.round(modelOutput.predicted).toLocaleString()} <small>tCO₂e</small></div></div><span className="landing-result__status"><Check size={13} /> Within model range</span></div>
                <div className="landing-result__bar"><span style={{ width: `${modelOutput.ratio}%` }} /></div><div className="landing-result__legend"><span>Projected output</span><strong>{Math.round(modelOutput.predicted).toLocaleString()} / {Math.round(modelOutput.baseline).toLocaleString()} baseline</strong></div>
                <div className="landing-result__stats"><div><span>Reduction potential</span><strong>{Math.round(modelOutput.reduction).toLocaleString()} <small>tCO₂e</small></strong></div><div><span>Estimated credits</span><strong>{modelOutput.credits.toLocaleString()} <small>credits</small></strong></div><div><span>Indicative value</span><strong>${modelOutput.value.toLocaleString()} <small>USD</small></strong></div></div>
                <div className="landing-result__footer"><div><span className="landing-live-dot" /> Live calculation</div><span>{selectedTech.name} / {utilization}% utilization</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="coverage" className="landing-section landing-section--coverage">
          <div className="landing-container landing-coverage">
            <div className="landing-coverage__copy"><span className="landing-overline">Coverage with context</span><h2>Start with iron & steel. Build from there.</h2><p>Pulse Carbon is tuned for high-intensity industrial operations where the difference between a good estimate and a defensible one matters.</p><div className="landing-coverage__list"><div><span><Check size={13} /></span><strong>950+ facilities</strong><small>mapped to source data</small></div><div><span><Check size={13} /></span><strong>81 countries</strong><small>available for comparison</small></div><div><span><Check size={13} /></span><strong>Audit-ready exports</strong><small>for every completed run</small></div></div></div>
            <div className="landing-coverage__card"><div className="landing-coverage__card-top"><Database size={19} /><span>Dataset profile / 2026</span></div><div className="landing-coverage__bars"><div><span>Iron & steel</span><b style={{ width: '92%' }} /></div><div><span>Chemicals</span><b style={{ width: '62%' }} /></div><div><span>Cement</span><b style={{ width: '48%' }} /></div><div><span>Other heavy industry</span><b style={{ width: '31%' }} /></div></div><div className="landing-coverage__card-foot"><span>Data coverage</span><strong>Expanding monthly <ArrowRight size={14} /></strong></div></div>
          </div>
        </section>

        <section id="workspace" className="landing-cta"><div className="landing-container landing-cta__inner"><div><span className="landing-overline">The next step is yours</span><h2>Bring one facility into focus.</h2></div><div><p>Open the workspace to model a real scenario, review the result, and keep the evidence with the decision.</p><Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')} size="lg">{isAuthenticated ? 'Open workspace' : 'Create your workspace'} <ArrowRight size={17} /></Button></div></div></section>
      </main>

      <footer className="landing-footer"><div className="landing-container landing-footer__inner"><div className="landing-footer__brand"><button className="landing-brand" onClick={() => navigate('/')}><span className="landing-brand__mark"><Leaf size={17} /></span><span>Pulse<span>Carbon</span></span></button><p>A more useful view of industrial emissions.</p></div><div className="landing-footer__links"><div><span>Explore</span><a href="#platform">Platform</a><a href="#method">Method</a><a href="#simulator">Simulator</a></div><div><span>Workspace</span><button onClick={() => navigate('/login')}>Sign in</button><button onClick={() => navigate('/register')}>Create account</button></div></div><div className="landing-footer__legal"><span>© {new Date().getFullYear()} Pulse Carbon</span><span>Industrial carbon intelligence</span></div></div></footer>
    </div>
  );
};

export default LandingPage;
