// k6 load test — Stress scenario (500 concurrent, sustained)
// Usage: k6 run tests/load/scenario_stress.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const BASE = __ENV.BASE_URL || "https://stickframe.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || "";

const pageLoad = new Trend("page_load_ms");
const failRate = new Rate("request_fails");

export const options = {
  stages: [
    { duration: "1m", target: 100 },
    { duration: "2m", target: 500 },
    { duration: "1m", target: 500 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    page_load_ms: ["p(95)<5000"],
    request_fails: ["rate<0.05"],
  },
};

export default function () {
  const headers = {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
  };

  const paths = [
    "/rest/v1/obras?select=id,nome,status&limit=20",
    "/rest/v1/orcamentos?select=id,cliente_nome,valor_total&limit=20",
    "/rest/v1/clientes?select=id,nome,telefone&limit=20",
    "/rest/v1/produtos?select=id,nome,preco&limit=20",
    "/rest/v1/insumos?select=id,nome,unidade&limit=20",
    "/rest/v1/equipamentos?select=id,nome&limit=20",
    "/rest/v1/contratos?select=id,nome,valor&limit=20",
    "/rest/v1/medicoes?select=id,obra_id&limit=20",
  ];

  const rnd = Math.random();
  if (rnd < 0.8) {
    const path = paths[Math.floor(Math.random() * paths.length)];
    const res = http.get(`${BASE}${path}`, { headers });
    pageLoad.add(res.timings.duration);
    failRate.add(res.status !== 200);
    check(res, { "read status 200": (r) => r.status === 200 });
  } else {
    const body = JSON.stringify({
      nome: `Stress ${Date.now()}`,
      empresa_id: "00000000-0000-0000-0000-000000000001",
      status: "orcamento",
    });
    const res = http.post(`${BASE}/rest/v1/obras`, body, { headers });
    pageLoad.add(res.timings.duration);
    failRate.add(res.status !== 201);
    check(res, { "write status 201": (r) => r.status === 201 });
  }

  sleep(0.2);
}
