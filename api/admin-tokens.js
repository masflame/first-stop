export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  const jwtToken = (req.headers["authorization"] || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!jwtToken) return res.status(401).json({ error: "Unauthorized" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const adminKey = process.env.ADMIN_KEY;

  // Accept either a valid Supabase JWT or the ADMIN_KEY env var
  const isAdminKey = adminKey && jwtToken === adminKey;
  if (!isAdminKey) {
    // Validate as Supabase JWT
    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${jwtToken}` },
    });
    if (!authRes.ok) return res.status(401).json({ error: "Unauthorized" });
  }

  // Fetch all tokens sorted by most-recently updated first
  const tokensRes = await fetch(
    `${supabaseUrl}/rest/v1/customer_payment_tokens?select=id,email,payfast_token,is_default,created_at,updated_at&order=updated_at.desc`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );

  if (!tokensRes.ok) {
    return res.status(500).json({ error: "Failed to fetch tokens" });
  }

  const tokens = await tokensRes.json();
  return res.status(200).json({ tokens: Array.isArray(tokens) ? tokens : [] });
}
