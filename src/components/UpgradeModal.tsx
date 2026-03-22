import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Zap, Crown, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Feature description that triggered the upgrade (e.g. "Exportação SVG") */
  featureName: string;
  /** Which plan upgrade to highlight: 'pro' (default) or 'team' */
  targetPlan?: 'pro' | 'team';
}

type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

interface CycleOption {
  key: BillingCycle;
  label: string;
  proPriceLabel: string;
  teamPriceLabel: string;
}

const CYCLE_OPTIONS: CycleOption[] = [
  { key: 'monthly',    label: '/mês',       proPriceLabel: '$9',  teamPriceLabel: '$19/editor' },
  { key: 'quarterly',  label: '/trimestre', proPriceLabel: '$24', teamPriceLabel: '$51/editor' },
  { key: 'semiannual', label: '/semestre',  proPriceLabel: '$42', teamPriceLabel: '$90/editor' },
  { key: 'annual',     label: '/ano',       proPriceLabel: '$72', teamPriceLabel: '$156/editor' },
];

const PRO_FEATURES = [
  'upgrade.proFeatures.unlimitedDiagrams',
  'upgrade.proFeatures.nodes200',
  'upgrade.proFeatures.allFormats',
  'upgrade.proFeatures.noWatermark',
  'upgrade.proFeatures.emailSharing',
  'upgrade.proFeatures.realtimeCollab',
];

export default function UpgradeModal({ open, onOpenChange, featureName, targetPlan = 'pro' }: Props) {
  const { t } = useTranslation();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(false);

  const selectedCycle = CYCLE_OPTIONS.find((c) => c.key === cycle)!;

  async function handleUpgrade(plan: 'pro' | 'team') {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { plan, billing_cycle: cycle },
      });
      if (error || !data?.url) throw new Error(error?.message || t('upgrade.checkoutError'));
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: t('upgrade.checkoutError'), description: err.message, variant: 'destructive' });
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-yellow-500" />
            {t('upgrade.title')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t('upgrade.featureBlocked', { feature: featureName })}
          </DialogDescription>
        </DialogHeader>

        {/* Billing cycle selector */}
        <div className="flex gap-1 rounded-lg border p-1 bg-muted/30">
          {CYCLE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setCycle(opt.key)}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                cycle === opt.key
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label.replace('/', '')}
            </button>
          ))}
        </div>

        {/* Plans side by side */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pro */}
          <div className={`rounded-xl border p-4 flex flex-col gap-3 ${targetPlan === 'pro' ? 'border-primary ring-1 ring-primary' : ''}`}>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm">Pro</span>
            </div>
            <div className="text-2xl font-bold">
              {selectedCycle.proPriceLabel}
              <span className="text-xs font-normal text-muted-foreground">{selectedCycle.label}</span>
            </div>
            <ul className="space-y-1.5 flex-1">
              {PRO_FEATURES.map((key) => (
                <li key={key} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <Button size="sm" onClick={() => handleUpgrade('pro')} disabled={loading} className="w-full mt-auto">
              {loading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              {t('upgrade.choosePro')}
            </Button>
          </div>

          {/* Team */}
          <div className={`rounded-xl border p-4 flex flex-col gap-3 ${targetPlan === 'team' ? 'border-primary ring-1 ring-primary' : ''}`}>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold text-sm">Team</span>
            </div>
            <div className="text-2xl font-bold">
              {selectedCycle.teamPriceLabel}
              <span className="text-xs font-normal text-muted-foreground">{selectedCycle.label}</span>
            </div>
            <ul className="space-y-1.5 flex-1">
              <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                {t('upgrade.teamFeatures.everythingPro')}
              </li>
              <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                {t('upgrade.teamFeatures.unlimitedNodes')}
              </li>
              <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                {t('upgrade.teamFeatures.workspaces')}
              </li>
              <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                {t('upgrade.teamFeatures.unlimitedCollaborators')}
              </li>
              <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                {t('upgrade.teamFeatures.prioritySupport')}
              </li>
            </ul>
            <Button size="sm" variant="outline" onClick={() => handleUpgrade('team')} disabled={loading} className="w-full mt-auto">
              {loading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              {t('upgrade.chooseTeam')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
