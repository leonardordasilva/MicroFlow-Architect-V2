import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((o) => o.trim()).filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0] || "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const MODEL_CASCADE = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
];

async function callWithFallback(apiKey: string, messages: { role: string; content: string }[]) {
  for (const model of MODEL_CASCADE) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages }),
      });
      if (response.status === 429 || response.status === 503) {
        console.warn(`Model ${model} returned ${response.status}, trying next...`);
        continue;
      }
      if (response.status === 402) {
        return { error: "Payment required. Add credits to your workspace.", status: 402 };
      }
      if (!response.ok) {
        const t = await response.text();
        console.error(`AI gateway error (${model}):`, response.status, t);
        continue;
      }
      const result = await response.json();
      return { data: result, status: 200 };
    } catch (e) {
      console.error(`Model ${model} failed:`, e);
      continue;
    }
  }
  return { error: "All AI models unavailable. Try again later.", status: 503 };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("API key not configured");

    const systemPrompt = `You are a microservices architecture expert. Given a description, generate a diagram as JSON.

Return ONLY valid JSON with this exact structure:
{
  "nodes": [
    {
      "id": "unique_id",
      "type": "service" | "database" | "queue" | "external",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Node Name",
        "type": "service" | "database" | "queue" | "external",
        "internalDatabases": [],
        "internalServices": []
      }
    }
  ],
  "edges": [
    {
      "id": "edge_id",
      "source": "source_node_id",
      "target": "target_node_id",
      "type": "smoothstep",
      "animated": true,
      "label": "optional label"
    }
  ]
}

Types:
- "service": microservice/API
- "database": database (PostgreSQL, MongoDB, Redis, etc.)
- "queue": message queue (RabbitMQ, Kafka, SQS, etc.)
- "external": external service (Stripe, SendGrid, AWS S3, etc.)

Rules:
- Use descriptive names in Portuguese when possible
- Create realistic connections between services
- Include appropriate databases and queues
- Position nodes spread out (increment x by 250, y by 150)
- Return ONLY the JSON, no markdown, no explanation`;

    const result = await callWithFallback(LOVABLE_API_KEY, [
      { role: "system", content: systemPrompt },
      { role: "user", content: description },
    ]);

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let content = result.data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const diagram = JSON.parse(content);

    return new Response(JSON.stringify(diagram), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diagram error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to generate diagram. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
