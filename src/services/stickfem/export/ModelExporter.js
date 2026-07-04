/**
 * ModelExporter — interface de exportação do modelo estrutural (Adapter).
 * Prepara o caminho para IFC/DXF (via provider externo) e PDF (local), sem
 * acoplar o núcleo. Apenas o exportador de PDF pode ser implementado hoje; os
 * demais são stubs honestos até haver contrato de API (ex.: POST /ifc/export).
 */
export class ModelExporter {
  get formato() { return "abstract"; }
  get disponivel() { return false; }
  /** @param {Object} _model @returns {Promise<Blob|string>} */
  async export(_model) {
    throw new Error(`ModelExporter[${this.formato}] não implementado.`);
  }
}

export class IFCExporter extends ModelExporter {
  get formato() { return "ifc"; }
  get disponivel() { return false; } // Futuro: POST /ifc/export (provider externo).
}

export class DXFExporter extends ModelExporter {
  get formato() { return "dxf"; }
  get disponivel() { return false; } // Futuro: POST /dxf/export ou gerador local.
}

export class PDFExporter extends ModelExporter {
  get formato() { return "pdf"; }
  get disponivel() { return true; }
  // A geração de PDF técnico já existe em exportAuditoria.js (memória de cálculo).
  // Este exportador é o ponto de extensão para um PDF do modelo completo.
}

const _exporters = new Map([["ifc", new IFCExporter()], ["dxf", new DXFExporter()], ["pdf", new PDFExporter()]]);
export function getExporter(formato) { return _exporters.get(formato) || null; }
export function listExporters() {
  return [..._exporters.values()].map((e) => ({ formato: e.formato, disponivel: e.disponivel }));
}
