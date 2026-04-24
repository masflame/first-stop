import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { getVisitorId, getSessionId } from "../utils/fingerprint";

const VISITOR_TABLE = "Shoedistrict_Visitors";
const supabaseUrl = import.meta.env.VITE_PROJECT_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

function getVisitorEndpoint(query = {}) {
  if (!supabaseUrl) return null;

  const url = new URL(`/rest/v1/${VISITOR_TABLE}`, supabaseUrl);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

async function requestVisitors({ method = "GET", query, body, prefer, keepalive = false }) {
  if (!supabaseUrl || !supabaseKey) {
    return { data: null, error: null };
  }

  const endpoint = getVisitorEndpoint(query);
  if (!endpoint) {
    return { data: null, error: null };
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive,
    });

    if (!response.ok) {
      let details = null;

      try {
        details = await response.json();
      } catch {
        details = await response.text();
      }

      return {
        data: null,
        error: {
          message: `Request failed with status ${response.status}`,
          status: response.status,
          details,
        },
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { data: null, error: null };
    }

    return {
      data: await response.json(),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown request error",
      },
    };
  }
}

async function fetchVisitor(visitorId) {
  const { data, error } = await requestVisitors({
    query: {
      visitor_id: `eq.${visitorId}`,
      select: "*",
      limit: "1",
    },
  });

  return {
    data: Array.isArray(data) ? data[0] || null : null,
    error,
  };
}

async function insertVisitor(row) {
  const { data, error } = await requestVisitors({
    method: "POST",
    query: { select: "*" },
    body: [row],
    prefer: "return=representation",
  });

  return {
    data: Array.isArray(data) ? data[0] || null : null,
    error,
  };
}

async function updateVisitor(visitorId, payload, options = {}) {
  return requestVisitors({
    method: "PATCH",
    query: {
      visitor_id: `eq.${visitorId}`,
      ...(options.select ? { select: options.select } : {}),
    },
    body: payload,
    prefer: options.prefer || "return=minimal",
    keepalive: options.keepalive || false,
  });
}

async function getClientIpAddress() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch("https://api64.ipify.org?format=json", {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.ip || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default function useVisitorTracker() {
  const { pathname, search } = useLocation();
  const pageStart = useRef(Date.now());
  const maxScroll = useRef(0);
  const dbRow = useRef(null);
  const session = useRef(null);
  const ready = useRef(false);
  const initCalled = useRef(false);

  function scrollPct() {
    const doc = document.documentElement;
    const h = doc.scrollHeight - doc.clientHeight;
    return h > 0 ? Math.round((window.scrollY / h) * 100) : 0;
  }

  function getUtm() {
    const p = new URLSearchParams(search);
    return {
      source: p.get("utm_source") || null,
      medium: p.get("utm_medium") || null,
      campaign: p.get("utm_campaign") || null,
    };
  }

  const persist = useCallback(async (sessions, extra = {}) => {
    if (!dbRow.current) return;

    const { error } = await updateVisitor(dbRow.current.visitor_id, {
      sessions,
      last_seen: new Date().toISOString(),
      ...extra,
    });

    if (error) {
      console.error("Visitor persist error:", error);
    }
  }, []);

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey || initCalled.current) return;
    initCalled.current = true;

    (async () => {
      const visitorId = await getVisitorId();
      const sessionId = getSessionId();
      const now = new Date().toISOString();
      const utm = getUtm();
      const ipAddress = await getClientIpAddress();

      const newSession = {
        sid: sessionId,
        ref: document.referrer || null,
        utm: (utm.source || utm.medium || utm.campaign) ? utm : null,
        started: now,
        pages: [{
          url: pathname,
          title: document.title,
          at: now,
          dur: null,
          scroll: null,
        }],
      };

      const { data: existing, error: existingError } = await fetchVisitor(visitorId);

      if (existingError) {
        console.error("Visitor fetch error:", existingError);
      }

      if (existing) {
        const sessions = Array.isArray(existing.sessions)
          ? [...existing.sessions, newSession]
          : [newSession];

        dbRow.current = existing;

        const { error } = await updateVisitor(visitorId, {
          sessions,
          visit_count: (existing.visit_count || 0) + 1,
          last_seen: now,
          ...(ipAddress ? { ip_address: ipAddress } : {}),
        });

        if (error) {
          console.error("Visitor update error:", error);
        }

        dbRow.current.sessions = sessions;
      } else {
        const row = {
          visitor_id: visitorId,
          user_agent: navigator.userAgent,
          screen_resolution: `${screen.width}x${screen.height}`,
          language: navigator.language,
          platform: navigator.platform,
          visit_count: 1,
          last_seen: now,
          sessions: [newSession],
          ...(ipAddress ? { ip_address: ipAddress } : {}),
        };

        const { data, error } = await insertVisitor(row);

        if (error) {
          console.error("Visitor insert error:", error);
        }

        dbRow.current = data || row;
      }

      session.current = newSession;
      ready.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!ready.current || !session.current || !dbRow.current) return;

    const now = new Date().toISOString();
    const pages = session.current.pages;

    if (pages.length > 0) {
      const last = pages[pages.length - 1];
      if (last.dur === null) {
        last.dur = Math.round((Date.now() - pageStart.current) / 1000);
        last.scroll = maxScroll.current;
      }
    }

    pages.push({
      url: `${pathname}${search}`,
      title: document.title,
      at: now,
      dur: null,
      scroll: null,
    });

    pageStart.current = Date.now();
    maxScroll.current = 0;

    const sessions = dbRow.current.sessions;
    sessions[sessions.length - 1] = session.current;
    persist(sessions);
  }, [pathname, search, persist]);

  useEffect(() => {
    function onScroll() {
      const pct = scrollPct();
      if (pct > maxScroll.current) maxScroll.current = pct;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onExit() {
      if (!ready.current || !dbRow.current || !session.current) return;

      const pages = session.current.pages;
      if (pages.length > 0) {
        const last = pages[pages.length - 1];
        if (last.dur === null) {
          last.dur = Math.round((Date.now() - pageStart.current) / 1000);
          last.scroll = maxScroll.current;
        }
      }

      const sessions = dbRow.current.sessions;
      sessions[sessions.length - 1] = session.current;

      updateVisitor(
        dbRow.current.visitor_id,
        { sessions, last_seen: new Date().toISOString() },
        { keepalive: true },
      ).catch(() => {});
    }

    window.addEventListener("beforeunload", onExit);
    return () => window.removeEventListener("beforeunload", onExit);
  }, [pathname, search]);
}