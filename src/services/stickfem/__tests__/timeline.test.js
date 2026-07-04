import { describe, it, expect } from "vitest";
import { normalizarEvento, metaTipo } from "../timeline/events";
import { agruparEventos, filtrarEventos, pesquisarEventos, indicadoresDashboard, usuariosDistintos } from "../timeline/timelineLogic";

const ev = (tipo, over = {}) => normalizarEvento({ tipo, ...over });
const base = "2026-07-04T09:00:00.000Z";
const min = (m) => new Date(new Date(base).getTime() + m * 60000).toISOString();

describe("events — catálogo e normalização", () => {
  it("normaliza tipo conhecido com ícone, módulo e severidade", () => {
    const e = ev("dxf_importado", { descricao: "42 elementos" });
    expect(e.modulo).toBe("projeto");
    expect(e.icone).toBe("📥");
    expect(e.severidade).toBe("info");
    expect(e.descricao).toBe("42 elementos");
  });
  it("conflito_detectado é atenção por padrão", () => {
    expect(metaTipo("conflito_detectado").severidade).toBe("atencao");
  });
  it("tipo desconhecido tem fallback", () => {
    expect(normalizarEvento({ tipo: "xyz" }).modulo).toBe("sistema");
  });
});

describe("agruparEventos", () => {
  it("agrupa eventos do mesmo tipo dentro da janela", () => {
    const eventos = [ev("mudanca_perfil", { at: min(0) }), ev("mudanca_perfil", { at: min(0.5) }), ev("mudanca_perfil", { at: min(0.8) })];
    const g = agruparEventos(eventos, { janelaMs: 60000 });
    expect(g).toHaveLength(1);
    expect(g[0].count).toBe(3);
  });
  it("não agrupa tipos diferentes nem fora da janela", () => {
    const eventos = [ev("mudanca_perfil", { at: min(0) }), ev("memorial_emitido", { at: min(0.2) }), ev("mudanca_perfil", { at: min(10) })];
    expect(agruparEventos(eventos, { janelaMs: 60000 })).toHaveLength(3);
  });
});

describe("filtrarEventos", () => {
  const eventos = [
    ev("predimensionamento", { usuario: "ana", at: min(0) }),
    ev("sugestao_aceita", { usuario: "joao", at: min(5) }),
    ev("aprovacao_tecnica", { usuario: "ana", at: min(10) }),
  ];
  it("filtra por usuário", () => {
    expect(filtrarEventos(eventos, { usuario: "ana" })).toHaveLength(2);
  });
  it("filtra por módulo e por preset", () => {
    expect(filtrarEventos(eventos, { modulo: "ia" })).toHaveLength(1);
    expect(filtrarEventos(eventos, { preset: "auditoria" })).toHaveLength(1);
  });
  it("filtra por período", () => {
    expect(filtrarEventos(eventos, { de: min(4), ate: min(6) })).toHaveLength(1);
  });
});

describe("pesquisarEventos", () => {
  it("encontra por payload/descrição", () => {
    const eventos = [ev("mudanca_perfil", { descricao: "Ue90 → Ue140", payload: { de: "Ue90", para: "Ue140" } }), ev("predimensionamento", {})];
    expect(pesquisarEventos(eventos, "ue140")).toHaveLength(1);
    expect(pesquisarEventos(eventos, "")).toHaveLength(2);
  });
});

describe("indicadoresDashboard", () => {
  it("aponta última aprovação, memorial, comparação e total", () => {
    const eventos = [
      ev("dxf_importado", { at: min(0) }),
      ev("memorial_emitido", { at: min(5), hash: "A3F9" }),
      ev("comparacao_executada", { at: min(7) }),
      ev("aprovacao_tecnica", { at: min(9) }),
    ];
    const ind = indicadoresDashboard(eventos);
    expect(ind.totalEventos).toBe(4);
    expect(ind.ultimaAprovacao.tipo).toBe("aprovacao_tecnica");
    expect(ind.ultimoMemorial.hash).toBe("A3F9");
    expect(ind.ultimaComparacao.tipo).toBe("comparacao_executada");
    expect(ind.ultimaAtividade.tipo).toBe("aprovacao_tecnica");
  });
});

describe("usuariosDistintos", () => {
  it("lista usuários únicos", () => {
    expect(usuariosDistintos([ev("x", { usuario: "ana" }), ev("y", { usuario: "ana" }), ev("z", { usuario: "joao" })])).toEqual(["ana", "joao"]);
  });
});
