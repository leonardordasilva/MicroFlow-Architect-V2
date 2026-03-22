import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const serviceSupabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

/** Map Stripe plan nickname/metadata to our plan enum */
function resolvePlan(metadata: Stripe.Metadata | null): string {
  if (!metadata) return "pro";
  return metadata.plan || "pro";
}

/** Update subscriptions + profiles.plan in one shot */
async function upsertSubscription(params: {
  userId: string;
  plan: string;
  status: string;
  billingCycle?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
}) {
  const record: Record<string, unknown> = {
    user_id: params.userId,
    plan: params.plan,
    status: params.status,
    updated_at: new Date().toISOString(),
  };
  if (params.billingCycle) record.billing_cycle = params.billingCycle;
  if (params.stripeCustomerId) record.stripe_customer_id = params.stripeCustomerId;
  if (params.stripeSubscriptionId) record.stripe_subscription_id = params.stripeSubscriptionId;
  if (params.currentPeriodStart) record.current_period_start = new Date(params.currentPeriodStart * 1000).toISOString();
  if (params.currentPeriodEnd) record.current_period_end = new Date(params.currentPeriodEnd * 1000).toISOString();

  await serviceSupabase
    .from("subscriptions")
    .upsert(record, { onConflict: "user_id" });

  await serviceSupabase
    .from("profiles")
    .update({ plan: params.plan })
    .eq("id", params.userId);
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return new Response(`Webhook error: ${err}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        const plan = session.metadata?.plan || "pro";
        const billingCycle = session.metadata?.billing_cycle;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id || "";
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id || "";

        let periodStart: number | undefined;
        let periodEnd: number | undefined;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          periodStart = sub.current_period_start;
          periodEnd = sub.current_period_end;
        }

        await upsertSubscription({
          userId,
          plan,
          status: "active",
          billingCycle,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        const plan = resolvePlan(sub.metadata);
        const status = sub.status === "active" || sub.status === "trialing" ? sub.status : sub.status;

        await upsertSubscription({
          userId,
          plan,
          status,
          stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          stripeSubscriptionId: sub.id,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
        });

        // saas0003: reconciliar quantity de editores no plano Team
        if (plan === "team") {
          const { data: workspace } = await serviceSupabase
            .from("workspaces")
            .select("id")
            .eq("stripe_subscription_id", sub.id)
            .maybeSingle();

          if (workspace) {
            const { data: editorCount } = await serviceSupabase
              .rpc("get_workspace_editor_count", { p_workspace_id: workspace.id });

            const realCount = Math.max(3, editorCount ?? 0);
            const stripeQuantity = sub.quantity ?? 0;
            if (realCount !== stripeQuantity) {
              await stripe.subscriptions.update(sub.id, { quantity: realCount });
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        const wasTeam = resolvePlan(sub.metadata) === "team";

        await upsertSubscription({
          userId,
          plan: "free",
          status: "canceled",
          stripeSubscriptionId: sub.id,
        });

        // saas0003: ao cancelar plano Team, remover subscription_id do workspace
        // (30-day grace period: membros ainda leem em read-only via RLS — archived depois)
        if (wasTeam) {
          await serviceSupabase
            .from("workspaces")
            .update({ stripe_subscription_id: null })
            .eq("stripe_subscription_id", sub.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id || "";
        if (!customerId) break;

        const { data: sub } = await serviceSupabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (sub?.user_id) {
          await serviceSupabase
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("user_id", sub.user_id);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return new Response(String(err), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
