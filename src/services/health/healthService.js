import { sb } from "../supabase";

const CHECKS = {
  DATABASE: "SELECT 1",
  AUTH: "usuarios",
};

let _lastLatency = 0;
let _lastCheck = null;
let _lastErrors = [];

export function getLastHealth() {
  return _lastCheck;
}

export function getLastLatency() {
  return _lastLatency;
}

export function getRecentErrors() {
  return _lastErrors;
}

function elapsed(start) {
  return performance.now() - start;
}

async function checkDatabase() {
  const start = performance.now();
  const { error } = await sb.from("obras").select("id", { count: "exact", head: true }).limit(1);
  return { ok: !error, latency: elapsed(start), error: error?.message };
}

async function checkAuth() {
  const start = performance.now();
  const { data, error } = await sb.auth.getSession();
  return { ok: !error, latency: elapsed(start), authed: !!data?.session, error: error?.message };
}

async function checkLatency() {
  const start = performance.now();
  const startNet = Date.now();
  await sb.from("obras").select("id", { count: "exact", head: true }).limit(1);
  const netMs = Date.now() - startNet;
  return { ok: true, latency: elapsed(start), netMs };
}

export async function runHealthCheck() {
  const startTotal = performance.now();
  const results = await Promise.allSettled([
    checkDatabase(),
    checkAuth(),
    checkLatency(),
  ]);

  const [db, auth, latency] = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { ok: false, error: r.reason?.message || String(r.reason), latency: 0 }
  );

  const allOk = db.ok && auth.ok;
  const avgLatency = db.latency + auth.latency / 2;

  _lastLatency = avgLatency;
  _lastCheck = {
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    database: db.ok ? "ok" : `error: ${db.error}`,
    auth: auth.ok ? (auth.authed ? "ok" : "unauthenticated") : `error: ${auth.error}`,
    latency: Math.round(avgLatency),
    netMs: latency.netMs || 0,
  };

  if (!allOk) {
    _lastErrors.push({ ts: _lastCheck.timestamp, database: db.error, auth: auth.error });
    if (_lastErrors.length > 50) _lastErrors.shift();
  }

  return _lastCheck;
}

export async function checkModuleHealth(moduleName, queryFn) {
  const start = performance.now();
  try {
    const result = await queryFn();
    return { module: moduleName, ok: true, latency: elapsed(start) };
  } catch (e) {
    return { module: moduleName, ok: false, latency: elapsed(start), error: e.message };
  }
}
