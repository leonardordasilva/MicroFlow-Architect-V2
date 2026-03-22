import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { workspaceId, email, role } = await req.json();
    if (!workspaceId || !email || !["editor", "viewer"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "workspaceId, email, and role (editor|viewer) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verificar que o caller é owner do workspace
    const { data: callerMember } = await serviceSupabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (callerMember?.role !== "owner") {
      return new Response(
        JSON.stringify({ error: "Only the workspace owner can invite members" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar se o email já é membro
    const { data: existingProfile } = await serviceSupabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingProfile) {
      // Usuário existe — verificar se já é membro
      const { data: alreadyMember } = await serviceSupabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", existingProfile.id)
        .maybeSingle();

      if (alreadyMember) {
        return new Response(
          JSON.stringify({ error: "User is already a workspace member" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Adicionar como membro pendente (accepted_at = null)
      await serviceSupabase.from("workspace_members").insert({
        workspace_id: workspaceId,
        user_id: existingProfile.id,
        role,
        invited_by: user.id,
        accepted_at: null,
      });
    } else {
      // Usuário não existe — criar convite por token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await serviceSupabase.from("workspace_invites").insert({
        workspace_id: workspaceId,
        email: email.toLowerCase().trim(),
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt,
      });
    }

    // Atualizar quantity no Stripe se for editor (cobrável)
    if (role === "editor") {
      try {
        const { data: workspace } = await serviceSupabase
          .from("workspaces")
          .select("stripe_subscription_id")
          .eq("id", workspaceId)
          .single();

        if (workspace?.stripe_subscription_id) {
          const { data: countData } = await serviceSupabase
            .rpc("get_workspace_editor_count", { p_workspace_id: workspaceId });

          const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
          });
          // +1 antecipado pois o novo editor ainda não está accepted
          const newCount = Math.max(3, (countData ?? 0) + 1);
          await stripe.subscriptions.update(workspace.stripe_subscription_id, {
            quantity: newCount,
          });
        }
      } catch (stripeErr) {
        console.warn("[invite-workspace-member] Stripe quantity update failed:", stripeErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[invite-workspace-member]", err);
    return new Response(String(err), { status: 500, headers: corsHeaders });
  }
});
