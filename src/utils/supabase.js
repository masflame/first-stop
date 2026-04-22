const supabaseUrl =
  import.meta.env.VITE_PROJECT_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

function buildHeaders() {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
  };
}

async function parseError(response) {
  try {
    const json = await response.json();
    return json;
  } catch {
    return { message: await response.text() };
  }
}

function tableClient(table) {
  return {
    async insert(rows) {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          ...buildHeaders(),
          Prefer: "return=minimal",
        },
        body: JSON.stringify(rows),
      });

      if (!response.ok) {
        return { data: null, error: await parseError(response) };
      }

      return { data: null, error: null };
    },

    update(values) {
      return {
        async eq(column, value) {
          const query = new URLSearchParams({ [column]: `eq.${value}` });
          const response = await fetch(
            `${supabaseUrl}/rest/v1/${table}?${query.toString()}`,
            {
              method: "PATCH",
              headers: {
                ...buildHeaders(),
                Prefer: "return=minimal",
              },
              body: JSON.stringify(values),
            }
          );

          if (!response.ok) {
            return { data: null, error: await parseError(response) };
          }

          return { data: null, error: null };
        },
      };
    },
  };
}

export const supabase = {
  from(table) {
    return tableClient(table);
  },
};
