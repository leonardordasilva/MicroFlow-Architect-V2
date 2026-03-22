import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Zap, Crown, Users, ArrowLeft, Loader2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import logoIcon from '@/img/MicroFlow_Icon_Low.avif';

type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

const PRICES_BRL: Record<string, Record<BillingCycle, string>> = {
  free: { monthly: 'R$ 0', quarterly: 'R$ 0', semiannual: 'R$ 0', annual: 'R$ 0' },
  pro: { monthly: 'R$ 49', quarterly: 'R$ 129', semiannual: 'R$ 219', annual: 'R$ 369' },
  team: { monthly: 'R$ 99', quarterly: 'R$ 259', semiannual: 'R$ 459', annual: 'R$ 759' },
};

const PRICES_USD: Record<string, Record<BillingCycle, string>> = {
  free: { monthly: '$0', quarterly: '$0', semiannual: '$0', annual: '$0' },
  pro: { monthly: '$9', quarterly: '$24', semiannual: '$42', annual: '$72' },
  team: { monthly: '$19', quarterly: '$51', semiannual: '$90', annual: '$156' },
};

const CYCLE_KEYS: BillingCycle[] = ['monthly', 'quarterly', 'semiannual', 'annual'];

const PLANS = [
  {
    id: 'free',
    nameKey: 'pricing.free',
    icon: null,
    features: [
      'pricing.freeFeatures.diagrams',
      'pricing.freeFeatures.nodes',
      'pricing.freeFeatures.formats',
      'pricing.freeFeatures.linkSharing',
      'pricing.freeFeatures.community',
    ],
    cta: 'pricing.ctaFree',
    highlight: false,
    accentColor: 'rgba(107,114,128,0.6)',
    glowColor: 'rgba(107,114,128,0.15)',
    iconColor: '#9ca3af',
  },
  {
    id: 'pro',
    nameKey: 'pricing.pro',
    icon: Zap,
    features: [
      'pricing.proFeatures.diagrams',
      'pricing.proFeatures.nodes',
      'pricing.proFeatures.formats',
      'pricing.proFeatures.emailSharing',
      'pricing.proFeatures.realtimeCollab',
      'pricing.proFeatures.support',
    ],
    cta: 'pricing.ctaPro',
    highlight: true,
    accentColor: 'rgba(59,130,246,0.6)',
    glowColor: 'rgba(59,130,246,0.2)',
    iconColor: '#60a5fa',
  },
  {
    id: 'team',
    nameKey: 'pricing.team',
    icon: Crown,
    features: [
      'pricing.teamFeatures.diagrams',
      'pricing.teamFeatures.nodes',
      'pricing.teamFeatures.formats',
      'pricing.teamFeatures.emailSharing',
      'pricing.teamFeatures.workspaces',
      'pricing.teamFeatures.support',
    ],
    cta: 'pricing.ctaTeam',
    highlight: false,
    accentColor: 'rgba(245,158,11,0.6)',
    glowColor: 'rgba(245,158,11,0.12)',
    iconColor: '#fbbf24',
  },
];

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPlan = searchParams.get('plan'); // 'pro' | 'team' | null
  const preselectedCycle = searchParams.get('cycle') as BillingCycle | null;
  const [cycle, setCycle] = useState<BillingCycle>(
    CYCLE_KEYS.includes(preselectedCycle as BillingCycle) ? (preselectedCycle as BillingCycle) : 'monthly'
  );
  const [loading, setLoading] = useState<string | null>(null);

  const isBRL = i18n.language.startsWith('pt');
  const prices = isBRL ? PRICES_BRL : PRICES_USD;

  // Refs for scrolling to a pre-selected plan card
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const autoCheckoutFiredRef = useRef(false);

  // Auto-trigger checkout when user arrives with ?plan= already logged in
  // Wait for both user AND session (access_token) to be available to avoid 401
  useEffect(() => {
    if (!preselectedPlan || preselectedPlan === 'free') return;
    if (!user || !session) return;
    if (autoCheckoutFiredRef.current) return;
    autoCheckoutFiredRef.current = true;
    handleCheckout(preselectedPlan);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session, preselectedPlan]);

  // Scroll to pre-selected plan after mount (fallback when not auto-triggering)
  useEffect(() => {
    if (!preselectedPlan || preselectedPlan === 'free') return;
    const el = cardRefs.current[preselectedPlan];
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    }
  }, [preselectedPlan]);

  // Load Google Fonts (same as Landing)
  useEffect(() => {
    if (document.getElementById('landing-fonts')) return;
    const link = document.createElement('link');
    link.id = 'landing-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;700&display=swap';
    document.head.appendChild(link);
  }, []);

  async function handleCheckout(planId: string) {
    if (!user) {
      navigate('/app', { state: { redirectTo: `/pricing?plan=${planId}&cycle=${cycle}` } });
      return;
    }
    if (planId === 'free') {
      navigate('/app');
      return;
    }
    setLoading(planId);
    try {
      // Get fresh session to guarantee the access_token is current
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (!activeSession) {
        navigate('/app', { state: { redirectTo: `/pricing?plan=${planId}&cycle=${cycle}` } });
        return;
      }
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { plan: planId, billing_cycle: cycle, app_url: window.location.origin },
        headers: { Authorization: `Bearer ${activeSession.access_token}` },
      });
      if (error || !data?.url) throw new Error(error?.message || t('upgrade.checkoutError'));
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: t('upgrade.checkoutError'), description: err.message, variant: 'destructive' });
      setLoading(null);
    }
  }

  const perNoteKey = (planId: string) =>
    planId === 'team' ? t('pricing.perEditorMonth') : planId === 'pro' ? t('pricing.perMonth') : null;

  return (
    <div
      style={{
        background: '#0f1520',
        color: '#e2e8f0',
        fontFamily: "'DM Sans', sans-serif",
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        /* ── Keyframes ── */
        @keyframes shimmer {
          0%   { background-position: -400% center; }
          100% { background-position:  400% center; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-20px); }
        }
        @keyframes glowPulse {
          0%,100% { opacity: 0.4; }
          50%     { opacity: 0.9; }
        }

        /* ── Blobs ── */
        .p-blob-1 { animation: float 9s ease-in-out infinite; }
        .p-blob-2 { animation: float 12s ease-in-out infinite 3s; }

        /* ── Title shimmer ── */
        .p-headline-shimmer {
          background: linear-gradient(
            90deg,
            #f1f5f9 0%, #f1f5f9 25%,
            #93c5fd 40%, #c4b5fd 55%,
            #f1f5f9 70%, #f1f5f9 100%
          );
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }

        /* ── Section accent gradient ── */
        .p-section-accent {
          display: inline-block;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Navbar ── */
        .p-nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 8px;
          transition: color 0.15s ease, background 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .p-nav-link:hover {
          color: #e2e8f0;
          background: rgba(255,255,255,0.07);
        }

        /* ── Cycle toggle ── */
        .p-cycle-btn {
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease, color 0.15s ease;
          font-family: inherit;
        }
        .p-cycle-btn-active {
          background: rgba(59,130,246,0.18) !important;
          color: #93c5fd !important;
        }
        .p-cycle-btn-inactive {
          background: transparent !important;
          color: #64748b !important;
        }
        .p-cycle-btn-inactive:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #94a3b8 !important;
        }

        /* ── Plan cards ── */
        .p-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease !important;
          animation: fadeInUp 0.55s cubic-bezier(0.4,0,0.2,1) both;
        }
        .p-card:hover {
          transform: translateY(-6px) !important;
        }

        /* ── CTA buttons ── */
        .p-btn-primary {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 15px;
          font-weight: 600;
          width: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease;
          font-family: inherit;
        }
        .p-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #ea6c00, #dc2626);
          box-shadow: 0 0 28px rgba(249,115,22,0.4), 0 6px 20px rgba(249,115,22,0.2);
          transform: translateY(-1px);
        }
        .p-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .p-btn-outline {
          background: rgba(255,255,255,0.04);
          color: #cbd5e1;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 15px;
          font-weight: 600;
          width: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
          font-family: inherit;
        }
        .p-btn-outline:hover:not(:disabled) {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        .p-btn-outline:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .p-btn-blue {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 15px;
          font-weight: 600;
          width: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
          font-family: inherit;
        }
        .p-btn-blue:hover:not(:disabled) {
          box-shadow: 0 0 28px rgba(59,130,246,0.45), 0 6px 20px rgba(59,130,246,0.2);
          transform: translateY(-1px);
        }
        .p-btn-blue:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ── Feature list items ── */
        .p-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.5;
        }

        /* ── FAQ / footer text ── */
        .p-footer-link {
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .p-footer-link:hover { color: #94a3b8; }
      `}</style>

      {/* ── Background blobs ── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div
          className="p-blob-1"
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="p-blob-2"
          style={{
            position: 'absolute',
            bottom: '5%',
            right: '-10%',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(15,21,32,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 24px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src={logoIcon} alt="MicroFlow" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', color: '#f1f5f9' }}>
              MicroFlow
            </span>
          </Link>

          {/* Back link + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user && (
              <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>
                {user.email}
              </span>
            )}
            <Link to="/" className="p-nav-link">
              <ArrowLeft style={{ width: '15px', height: '15px' }} />
              {isBRL ? 'Início' : 'Home'}
            </Link>
            {!user && (
              <Link
                to="/app"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '7px 16px',
                  borderRadius: '8px',
                  transition: 'opacity 0.15s ease',
                }}
              >
                {isBRL ? 'Login' : 'Login'}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px 120px' }}>

          {/* ── Hero ── */}
          <div
            style={{ textAlign: 'center', marginBottom: '64px', animation: 'fadeInDown 0.6s ease both' }}
          >
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: '100px',
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#93c5fd',
                marginBottom: '24px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Star style={{ width: '12px', height: '12px' }} />
              {isBRL ? 'Planos e Preços' : 'Plans & Pricing'}
            </div>

            <h1
              className="p-headline-shimmer"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 700,
                lineHeight: 1.15,
                margin: '0 0 16px',
              }}
            >
              {t('pricing.title')}
            </h1>
            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
              {t('pricing.subtitle')}
            </p>
          </div>

          {/* ── Billing cycle toggle ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '56px' }}>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '5px',
              }}
            >
              {CYCLE_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setCycle(key)}
                  className={`p-cycle-btn ${cycle === key ? 'p-cycle-btn-active' : 'p-cycle-btn-inactive'}`}
                >
                  {t(`pricing.cycle${key.charAt(0).toUpperCase() + key.slice(1)}` as any)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Plan cards ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              alignItems: 'stretch',
            }}
          >
            {PLANS.map((plan, idx) => {
              const Icon = plan.icon;
              const isLoading = loading === plan.id;
              const price = prices[plan.id]?.[cycle] ?? '-';
              const perNote = perNoteKey(plan.id);

              return (
                <div
                  key={plan.id}
                  ref={(el) => { cardRefs.current[plan.id] = el; }}
                  className="p-card"
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    background: plan.highlight
                      ? 'linear-gradient(145deg, rgba(59,130,246,0.08), rgba(139,92,246,0.05))'
                      : preselectedPlan === plan.id
                      ? 'rgba(245,158,11,0.05)'
                      : 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: plan.highlight
                      ? '1px solid rgba(59,130,246,0.35)'
                      : preselectedPlan === plan.id
                      ? '1px solid rgba(245,158,11,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: plan.highlight
                      ? `0 0 0 1px rgba(59,130,246,0.2), 0 20px 60px rgba(59,130,246,0.12)`
                      : preselectedPlan === plan.id
                      ? '0 0 0 1px rgba(245,158,11,0.25), 0 16px 48px rgba(245,158,11,0.12)'
                      : '0 4px 24px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Highlight glow top-right */}
                  {plan.highlight && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-40px',
                        right: '-40px',
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* ── Plan header ── */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: `rgba(${plan.highlight ? '59,130,246' : plan.id === 'team' ? '245,158,11' : '107,114,128'},0.15)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {Icon
                          ? <Icon style={{ width: '18px', height: '18px', color: plan.iconColor }} />
                          : <Users style={{ width: '18px', height: '18px', color: plan.iconColor }} />
                        }
                      </div>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: '18px',
                          color: '#f1f5f9',
                        }}
                      >
                        {t(plan.nameKey)}
                      </span>
                    </div>
                    {plan.highlight && (
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '100px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t('pricing.popular')}
                      </span>
                    )}
                  </div>

                  {/* ── Price ── */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: '44px',
                          fontWeight: 800,
                          color: plan.highlight ? '#93c5fd' : '#f1f5f9',
                          lineHeight: 1,
                        }}
                      >
                        {price}
                      </span>
                    </div>
                    {perNote && (
                      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{perNote}</p>
                    )}
                  </div>

                  {/* ── Divider ── */}
                  <div
                    style={{
                      height: '1px',
                      background: 'rgba(255,255,255,0.07)',
                      marginBottom: '24px',
                    }}
                  />

                  {/* ── Features ── */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    {plan.features.map((key) => (
                      <li key={key} className="p-feature-item">
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'rgba(34,197,94,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '1px',
                          }}
                        >
                          <Check style={{ width: '10px', height: '10px', color: '#4ade80' }} />
                        </div>
                        {t(key)}
                      </li>
                    ))}
                  </ul>

                  {/* ── CTA ── */}
                  <button
                    className={
                      plan.highlight
                        ? 'p-btn-blue'
                        : plan.id === 'team'
                        ? 'p-btn-primary'
                        : 'p-btn-outline'
                    }
                    onClick={() => handleCheckout(plan.id)}
                    disabled={!!loading}
                  >
                    {isLoading && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                    {t(plan.cta)}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Footer note ── */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#475569',
              marginTop: '56px',
              lineHeight: 1.6,
            }}
          >
            {t('pricing.footer')}
          </p>

          {/* ── Back to top ── */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/" className="p-footer-link" style={{ fontSize: '13px' }}>
              ← {isBRL ? 'Voltar à página inicial' : 'Back to home'}
            </Link>
          </div>
        </div>
      </main>

      {/* ── Page footer ── */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.2)',
          padding: '32px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoIcon} alt="MicroFlow" style={{ width: '24px', height: '24px', borderRadius: '6px', opacity: 0.7 }} />
            <span style={{ fontSize: '13px', color: '#475569' }}>
              {isBRL ? '© 2026 MicroFlow Architect. Todos os direitos reservados.' : '© 2026 MicroFlow Architect. All rights reserved.'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/" className="p-footer-link" style={{ fontSize: '13px' }}>
              {isBRL ? 'Início' : 'Home'}
            </Link>
            <Link to="/app" className="p-footer-link" style={{ fontSize: '13px' }}>
              {isBRL ? 'App' : 'App'}
            </Link>
            {user && (
              <Link to="/account" className="p-footer-link" style={{ fontSize: '13px' }}>
                {isBRL ? 'Minha Conta' : 'My Account'}
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
