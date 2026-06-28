// k6 load test — Light scenario (50 concurrent users, read-heavy)
// Usage: k6 run tests/load/scenario_light.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const BASE = __ENV.BASE_URL || "https://stickframe.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || "";

const pageLoad = new Trend("page_load_ms");
const failRate = new Rate("request_fails");

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    page_load_ms: ["p(95)<2000"],
    request_fails: ["rate<0.01"],
  },
};

export default function () {
  const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

  const pages = [
    "/rest/v1/obras?select=id,nome,status&limit=20",
    "/rest/v1/orcamentos?select=id,cliente_nome,valor_total&limit=20",
    "/rest/v1/clientes?select=id,nome,telefone&limit=20",
  ];

  for (const path of pages) {
    const start = Date.now();
    const res = http.get(`${BASE}${path}`, { headers });
    const elapsed = Date.now() - start;
    pageLoad.add(elapsed);
    failRate.add(res.status !== 200);
    check(res, { "status 200": (r) => r.status === 200 });
    sleep(1);
  }
}
