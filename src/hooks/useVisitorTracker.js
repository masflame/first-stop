import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { getVisitorId, getSessionId } from "../utils/fingerprint";

const VISITOR_TABLE = "ShoeDistrict_Visitors";

function visitorsTable() {
  if (!supabase) return null;
  return supabase.from(VISITOR_TABLE);
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

    const table = visitorsTable();
    if (!table) return;

    const { error } = await table
      .update({ sessions, last_seen: new Date().toISOString(), ...extra })
      .eq("visitor_id", dbRow.current.visitor_id);

    if (error) {
      console.error("Visitor persist error:", error);
    }
  }, []);

  useEffect(() => {
    if (!supabase || initCalled.current) return;
    initCalled.current = true;

    (async () => {
      const visitorId = await getVisitorId();
      const sessionId = getSessionId();
      const now = new Date().toISOString();
      const utm = getUtm();
      const ipAddress = await getClientIpAddress();
      const table = visitorsTable();
      if (!table) return;

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

      const { data: existing, error: existingError } = await table
        .select("*")
        .eq("visitor_id", visitorId)
        .maybeSingle();

      if (existingError) {
        console.error("Visitor fetch error:", existingError);
      }

      if (existing) {
        const sessions = Array.isArray(existing.sessions)
          ? [...existing.sessions, newSession]
          : [newSession];

        dbRow.current = existing;

        const { error } = await table
          .update({
            sessions,
            visit_count: (existing.visit_count || 0) + 1,
            last_seen: now,
            ...(ipAddress ? { ip_address: ipAddress } : {}),
          })
          .eq("visitor_id", visitorId);

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

        const { data, error } = await table
          .insert([row])
          .select()
          .single();

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

      const baseUrl = import.meta.env.VITE_PROJECT_URL || import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!baseUrl || !apiKey) return;

      const url = `${baseUrl}/rest/v1/${VISITOR_TABLE}?visitor_id=eq.${encodeURIComponent(dbRow.current.visitor_id)}`;

      fetch(url, {
        method: "PATCH",
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ sessions, last_seen: new Date().toISOString() }),
        keepalive: true,
      }).catch(() => {});
    }

    window.addEventListener("beforeunload", onExit);
    return () => window.removeEventListener("beforeunload", onExit);
  }, [pathname, search]);
}