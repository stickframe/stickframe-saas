import { describe, it, expect } from "vitest";
import { mapProfileFromCalcSteel, tipoStickFem, CALCSTEEL_STANDARDS } from "../catalogo/calcsteelMapping";
import { fetchProfiles, CALCSTEEL_ENDPOINTS } from "../catalogo/calcsteelClient";
import { planejarSync } from "../catalogo/profileCatalog";

// Exemplo REAL documentado (GET /profiles → W310×97).
const W310 = {
  id: "AISC_W310X97", name: "W310×97", family: "W", standard: "AISC", category: "hot_rolled",
  h: 308, b: 305, tw: 9.9, tf: 15.4, weight_per_meter: 97.0,
  A: 12300, Ix: 222e6, Iy: 72.4e6, Sx: 1440e3, Sy: 475e3, Zx: 1600e3, Zy: 724e3,
  rx: 134, ry: 76.7, J: 1030e3, Cw: 1540e9,
};

describe("mapProfileFromCalcSteel", () => {
  it("mapeia os campos reais da API para colunas de perfil_estrutural", () => {
    const p = mapProfileFromCalcSteel(W310);
    expect(p.codigo).toBe("AISC_W310X97");
    expect(p.nome).toBe("W310×97");
    expect(p.norma).toBe("AISC");
    expect(p.area_mm2).toBe(12300);
    expect(p.inercia_x_mm4).toBe(222e6);
    expect(p.modulo_zx_mm3).toBe(1600e3);
    expect(p.constante_empenamento_mm6).toBe(1540e9);
    expect(p.raio_giracao_y_mm).toBe(76.7);
    expect(p.espessura_mm).toBe(9.9); // tw → alma
  });

  it("cold_formed U vira guia; Ue/C vira montante", () => {
    expect(tipoStickFem({ family: "U", category: "cold_formed" })).toBe("guia");
    expect(tipoStickFem({ family: "Ue", category: "cold_formed" })).toBe("montante");
    expect(tipoStickFem({ family: "W", category: "hot_rolled" })).toBe("perfil");
  });

  it("NBR 14762 (formado a frio) está na lista de normas suportadas", () => {
    expect(CALCSTEEL_STANDARDS["NBR 14762:2010"].categoria).toBe("cold_formed");
  });
});

describe("fetchProfiles (proxy injetado, sem rede)", () => {
  it("monta a query e devolve perfis já mapeados", async () => {
    let capturado = null;
    const proxyFetch = async (path) => { capturado = path; return [W310]; };
    const perfis = await fetchProfiles(proxyFetch, { family: "W", standard: "AISC", category: "hot_rolled" });
    expect(capturado).toContain(CALCSTEEL_ENDPOINTS.profiles);
    expect(capturado).toContain("family=W");
    expect(perfis[0].area_mm2).toBe(12300);
  });

  it("perfis mapeados alimentam o planejador de sync como 'novos'", async () => {
    const perfis = await fetchProfiles(async () => [W310], {});
    const plano = planejarSync(perfis, []);
    expect(plano.novos).toHaveLength(1);
    expect(plano.novos[0].codigo).toBe("AISC_W310X97");
  });
});
