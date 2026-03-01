import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Helpers ────────────────────────────────────────────────

function getKeyBytes(): Uint8Array {
  const raw = Deno.env.get("DIAGRAM_ENCRYPTION_KEY");
  if (!raw) throw new Error("DIAGRAM_ENCRYPTION_KEY not configured");

  // Decode Base64 key → 32 bytes (AES-256)
  const decoded = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  if (decoded.length !== 32) {
    throw new Error("DIAGRAM_ENCRYPTION_KEY must be 32 bytes (Base64-encoded)");
  }
  return decoded;
}

async function importKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Encrypt JSON → { iv, ciphertext } (both Base64) */
async function encrypt(
  plainJson: unknown,
  key: CryptoKey,
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(plainJson));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(
      String.fromCharCode(...new Uint8Array(encrypted)),
    ),
  };
}

/** Decrypt { iv, ciphertext } → parsed JSON */
async function decrypt(
  payload: { iv: string; ciphertext: string },
  key: CryptoKey,
): Promise<unknown> {
  const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(payload.ciphertext), (c) =>
    c.charCodeAt(0),
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

/** Detect if value is an encrypted envelope */
function isEncrypted(value: unknown): value is { iv: string; ciphertext: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "iv" in value &&
    "ciphertext" in value
  );
}

// ─── Handler ────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, nodes, edges } = body as {
      action: "encrypt" | "decrypt";
      nodes: unknown;
      edges: unknown;
    };

    if (!action || !["encrypt", "decrypt"].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'action must be "encrypt" or "decrypt"' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const keyBytes = getKeyBytes();
    const key = await importKey(keyBytes);

    if (action === "encrypt") {
      const [encNodes, encEdges] = await Promise.all([
        encrypt(nodes ?? [], key),
        encrypt(edges ?? [], key),
      ]);
      return new Response(
        JSON.stringify({ nodes: encNodes, edges: encEdges }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // decrypt — handle both encrypted and plain (backward-compat)
    const decNodes = isEncrypted(nodes) ? await decrypt(nodes, key) : nodes;
    const decEdges = isEncrypted(edges) ? await decrypt(edges, key) : edges;

    return new Response(
      JSON.stringify({ nodes: decNodes, edges: decEdges }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("diagram-crypto error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Encryption/decryption failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
