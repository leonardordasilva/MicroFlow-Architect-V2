import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Zap, Crown, Users, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { toast } from '@/hooks/use-toast';

const PLAN_ICON: Record<string, React.ElementType> = {
  free: Users,
  pro: Zap,
  team: Crown,
};
const PLAN_ICON_CLASS: Record<string, string> = {
  free: 'text-muted-foreground',
  pro: 'text-blue-500',
  team: 'text-yellow-500',
};

async function fetchSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

async function fetchDiagramCount(userId: string) {
  const { data, error } = await supabase.rpc('get_user_diagram_count', { p_user_id: userId });
  if (error || data === null) return 0;
  return data as number;
}

export default function Account() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const planLimits = usePlanLimits();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutProcessing, setCheckoutProcessing] = useState(
    searchParams.get('checkout') === 'success'
  );
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => fetchSubscription(user!.id),
    enabled: !!user,
    staleTime: checkoutProcessing ? 0 : 60_000,
  });

  // After successful checkout: call verify-checkout to update subscription immediately
  useEffect(() => {
    if (!checkoutProcessing || !user) return;

    const sessionId = searchParams.get('session_id');

    async function verifyAndUpdate() {
      // If we have a session_id, verify directly with Stripe (no webhook needed)
      if (sessionId) {
        try {
          const { data: { session: activeSession } } = await supabase.auth.getSession();
          if (!activeSession) return;

          const { data, error } = await supabase.functions.invoke('verify-checkout', {
            body: { session_id: sessionId },
            headers: { Authorization: `Bearer ${activeSession.access_token}` },
          });

          if (!error && data?.verified) {
            await queryClient.invalidateQueries({ queryKey: ['subscription', user!.id] });
            await queryClient.invalidateQueries({ queryKey: ['plan-limits', user!.id] });
            setCheckoutProcessing(false);
            navigate('/account', { replace: true });
            return;
          }
        } catch (_) {
          // fall through to polling
        }
      }

      // Fallback: poll DB (for webhook-based updates)
      pollIntervalRef.current = setInterval(async () => {
        pollAttemptsRef.current += 1;
        const sub = await fetchSubscription(user!.id);
        const updated = sub?.plan && sub.plan !== 'free' && sub.status === 'active';

        if (updated || pollAttemptsRef.current >= 10) {
          clearInterval(pollIntervalRef.current!);
          await queryClient.invalidateQueries({ queryKey: ['subscription', user!.id] });
          await queryClient.invalidateQueries({ queryKey: ['plan-limits', user!.id] });
          setCheckoutProcessing(false);
          navigate('/account', { replace: true });
        }
      }, 3000);
    }

    verifyAndUpdate();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutProcessing, user?.id]);

  const { data: diagramCount = 0 } = useQuery({
    queryKey: ['diagram-count', user?.id],
    queryFn: () => fetchDiagramCount(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal', {});
      if (error || !data?.url) throw new Error(error?.message || t('account.portalError'));
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: t('account.portalError'), description: err.message, variant: 'destructive' });
      setPortalLoading(false);
    }
  }

  const plan = planLimits.plan;
  const PlanIcon = PLAN_ICON[plan] || Users;
  const planIconClass = PLAN_ICON_CLASS[plan] || '';

  const diagramLimit = planLimits.maxDiagrams;
  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-lg">
        <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>

        <h1 className="text-2xl font-bold mb-8">{t('account.title')}</h1>

        {/* Checkout processing banner */}
        {checkoutProcessing && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 mb-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500 shrink-0" />
            <div>
              <p className="font-medium text-sm">{t('account.checkoutProcessing')}</p>
              <p className="text-xs text-muted-foreground">{t('account.checkoutProcessingDesc')}</p>
            </div>
          </div>
        )}

        {/* Current plan card */}
        <div className="rounded-xl border bg-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <PlanIcon className={`h-6 w-6 ${planIconClass}`} />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('account.currentPlan')}</p>
              <p className="font-bold text-xl capitalize">{plan}</p>
            </div>
            {subscription && (
              <span className={`ml-auto text-xs font-medium rounded-full px-2.5 py-1 ${
                subscription.status === 'active' ? 'bg-green-500/10 text-green-600' :
                subscription.status === 'past_due' ? 'bg-red-500/10 text-red-600' :
                'bg-muted text-muted-foreground'
              }`}>
                {subscription.status}
              </span>
            )}
          </div>

          {subscription?.billing_cycle && (
            <p className="text-sm text-muted-foreground mb-1">
              {t('account.billingCycle')}: <span className="font-medium capitalize">{subscription.billing_cycle}</span>
            </p>
          )}
          {renewalDate && (
            <p className="text-sm text-muted-foreground mb-4">
              {t('account.renewsOn')}: <span className="font-medium">{renewalDate}</span>
            </p>
          )}

          <div className="flex gap-3 flex-wrap">
            {plan !== 'free' ? (
              <Button variant="outline" size="sm" onClick={openPortal} disabled={portalLoading} className="gap-2">
                {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                {t('account.manageSubscription')}
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/pricing')} className="gap-2">
                <Zap className="h-3 w-3" />
                {t('account.upgradePlan')}
              </Button>
            )}
          </div>
        </div>

        {/* Usage */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4">{t('account.usage')}</h2>

          {/* Diagrams */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">{t('account.diagrams')}</span>
              <span className="font-medium">
                {diagramCount}
                {diagramLimit !== null ? ` / ${diagramLimit}` : ` / ${t('account.unlimited')}`}
              </span>
            </div>
            {diagramLimit !== null && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    diagramCount >= diagramLimit ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, (diagramCount / diagramLimit) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Node limit */}
          <div className="text-sm text-muted-foreground">
            {t('account.nodesPerDiagram')}:{' '}
            <span className="font-medium text-foreground">
              {planLimits.maxNodesPerDiagram !== null ? planLimits.maxNodesPerDiagram : t('account.unlimited')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
