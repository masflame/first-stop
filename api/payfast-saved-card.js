// Returns the logged-in user's saved card display info (card_last_four, card_type).
// The actual PayFast token is NEVER sent to the frontend.
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  const jwtToken = (req.headers["authorization"] || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!jwtToken) return res.status(401).json({ error: "Unauthorized" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  // Verify the JWT and get the user's email
  const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  if (!authRes.ok) return res.status(401).json({ error: "Unauthorized" });

  const user = await authRes.json();
  const email = user?.email?.toLowerCase?.();
  if (!email) return res.status(401).json({ error: "Unauthorized" });

  // Look up saved card by email using service key — token is NOT returned
  const cardRes = await fetch(
    `${supabaseUrl}/rest/v1/customer_payment_tokens?email=eq.${encodeURIComponent(email)}&is_default=eq.true&select=id,user_id,card_last_four,card_type&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  const cards = await cardRes.json();
  const savedCard =
    Array.isArray(cards) && cards.length > 0 ? cards[0] : null;

  // Lazily link user_id to the token if it hasn't been set yet
  if (savedCard?.id && !savedCard.user_id && user.id) {
    fetch(
      `${supabaseUrl}/rest/v1/customer_payment_tokens?id=eq.${savedCard.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ user_id: user.id }),
      }
    ).catch(() => {});
  }

  // Only return display-safe fields — never expose the token
  const display = savedCard
    ? { card_last_four: savedCard.card_last_four, card_type: savedCard.card_type }
    : null;

  return res.status(200).json({ savedCard: display });
}
