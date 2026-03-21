import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useDiagramStore } from '@/store/diagramStore';
import { clearAutoSave } from '@/hooks/useAutoSave';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: t('auth.emailSent'),
          description: t('auth.emailSentDesc'),
        });
        return;
      }
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Clear canvas and auto-save on fresh login
        const store = useDiagramStore.getState();
        store.clearCanvas();
        store.setDiagramName(t('diagram.newDiagram'));
        store.setCurrentDiagramId(undefined);
        clearAutoSave();
        toast({ title: t('auth.loginSuccess') });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: t('auth.signupSuccessMsg') });
      }
    } catch (err: any) {
      const msgMap: Record<string, string> = {
        'Invalid login credentials': t('auth.invalidCredentials'),
        'Email not confirmed': t('auth.emailNotConfirmed'),
        'User already registered': t('auth.emailAlreadyUsed'),
        'Signup requires a valid password': t('auth.passwordTooShort'),
        'Password should be at least 6 characters': t('auth.passwordTooShort'),
        'For security purposes, you can only request this once every 60 seconds':
          t('auth.rateLimited'),
      };
      const translated = msgMap[err.message] || err.message;
      toast({ title: t('common.error'), description: translated, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const subtitle =
    view === 'login'
      ? t('auth.loginTitle')
      : view === 'signup'
        ? t('auth.signupTitle')
        : t('auth.recoverTitle');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-lg">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">MicroFlow Architect</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              required
            />
          </div>

          {view !== 'forgot' && (
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? t('auth.waiting')
              : view === 'login'
                ? t('auth.loginBtn')
                : view === 'signup'
                  ? t('auth.createAccountBtn')
                  : t('auth.sendRecoveryBtn')}
          </Button>
        </form>

        {view === 'login' && (
          <div className="text-center space-y-2">
            <button
              type="button"
              className="text-sm text-primary underline"
              onClick={() => setView('forgot')}
            >
              {t('auth.forgotPasswordLink')}
            </button>
            <p className="text-sm text-muted-foreground">
              {t('auth.noAccountPrompt')}{' '}
              <button type="button" className="text-primary underline" onClick={() => setView('signup')}>
                {t('auth.createAccountBtn')}
              </button>
            </p>
          </div>
        )}

        {view === 'signup' && (
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.hasAccountPrompt')}{' '}
            <button type="button" className="text-primary underline" onClick={() => setView('login')}>
              {t('auth.doLogin')}
            </button>
          </p>
        )}

        {view === 'forgot' && (
          <div className="text-center">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-primary underline"
              onClick={() => setView('login')}
            >
              <ArrowLeft className="h-3 w-3" />
              {t('auth.backToLogin')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
