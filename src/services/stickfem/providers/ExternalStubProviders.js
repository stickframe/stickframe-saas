/**
 * Stubs de providers externos preparados pela arquitetura (Adapter), mas ainda
 * não implementados. Existem para que a UI e o Provider Manager já os listem
 * ("preparado, indisponível") sem que o núcleo precise mudar quando forem
 * implementados de verdade. Nenhum deles fabrica resultado: todos lançam
 * ProviderNotConfiguredError via analyze() herdado da classe base.
 */
import { StructuralAnalysisProvider } from "./StructuralAnalysisProvider";

export class OpenSeesProvider extends StructuralAnalysisProvider {
  get id() { return "opensees"; }
  get nome() { return "OpenSees"; }
  get externo() { return true; }
  get disponivel() { return false; }
}

export class RFEMProvider extends StructuralAnalysisProvider {
  get id() { return "rfem"; }
  get nome() { return "RFEM (Dlubal)"; }
  get externo() { return true; }
  get disponivel() { return false; }
}

export class SAP2000Provider extends StructuralAnalysisProvider {
  get id() { return "sap2000"; }
  get nome() { return "SAP2000 (import/export)"; }
  get externo() { return true; }
  get disponivel() { return false; }
}
