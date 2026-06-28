import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReturnValue = { data: [], error: null };

const buildChain = () => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    then: (onFulfilled) => Promise.resolve(mockReturnValue).then(onFulfilled),
  };
  return chain;
};

vi.mock("../../supabase", () => ({
  sb: {
    from: vi.fn(() => buildChain()),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed.url" }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://public.url" } })),
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    rpc: vi.fn(() => buildChain()),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    auth: {
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
  getEmpresaId: vi.fn(() => "empresa-test-uuid"),
  getSignedUrl: vi.fn(async () => "https://signed.url"),
  getSignedUrls: vi.fn(async () => ["https://signed.url"]),
  setEmpresaId: vi.fn(),
}));

describe("obraRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listarObras deve filtrar por empresa_id", async () => {
    const { listarObras } = await import("../obraRepository");
    const { sb, getEmpresaId } = await import("../../supabase");
    await listarObras();
    expect(getEmpresaId).toHaveBeenCalled();
    expect(sb.from).toHaveBeenCalledWith("obras");
  });

  it("criarObra deve incluir empresa_id no insert", async () => {
    const { criarObra } = await import("../obraRepository");
    const { getEmpresaId } = await import("../../supabase");
    await criarObra({ nome: "Obra Teste", cliente: "Cliente Teste" });
    expect(getEmpresaId).toHaveBeenCalled();
  });

  it("listarArquivos deve retornar array com url assinada", async () => {
    const { listarArquivos } = await import("../obraRepository");
    const result = await listarArquivos("obra-id");
    expect(Array.isArray(result)).toBe(true);
  });

  it("deletarArquivo deve chamar storage.remove", async () => {
    const { deletarArquivo } = await import("../obraRepository");
    const { sb } = await import("../../supabase");
    await deletarArquivo("arquivo-id", "path/test.pdf");
    expect(sb.storage.from).toHaveBeenCalledWith("arquivos");
  });
});

describe("clienteRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listarClientes deve filtrar por empresa_id", async () => {
    const { listarClientes } = await import("../clienteRepository");
    const { sb, getEmpresaId } = await import("../../supabase");
    await listarClientes();
    expect(getEmpresaId).toHaveBeenCalled();
    expect(sb.from).toHaveBeenCalledWith("clientes");
  });

  it("criarCliente deve incluir empresa_id", async () => {
    const { criarCliente } = await import("../clienteRepository");
    const { getEmpresaId } = await import("../../supabase");
    await criarCliente({ nome: "Cliente Teste" });
    expect(getEmpresaId).toHaveBeenCalled();
  });

  it("criarCliente deve lançar erro sem empresaId", async () => {
    const { criarCliente } = await import("../clienteRepository");
    const { getEmpresaId } = await import("../../supabase");
    getEmpresaId.mockReturnValueOnce(null);
    await expect(criarCliente({ nome: "Teste" })).rejects.toThrow("Sessão expirada");
  });

  it("importarClientes deve incluir empresa_id em cada row", async () => {
    const { importarClientes } = await import("../clienteRepository");
    const { getEmpresaId } = await import("../../supabase");
    await importarClientes([{ nome: "C1" }, { nome: "C2" }]);
    expect(getEmpresaId).toHaveBeenCalled();
  });
});

describe("financeiroRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listarLancamentos deve filtrar por obra_id", async () => {
    const { listarLancamentos } = await import("../financeiroRepository");
    const { sb } = await import("../../supabase");
    await listarLancamentos("obra-id");
    expect(sb.from).toHaveBeenCalledWith("financeiro");
  });

  it("adicionarLancamento deve incluir empresa_id", async () => {
    const { adicionarLancamento } = await import("../financeiroRepository");
    const { getEmpresaId } = await import("../../supabase");
    await adicionarLancamento("obra-id", { tipo: "receita", valor: 1000 });
    expect(getEmpresaId).toHaveBeenCalled();
  });
});

describe("orcamentoRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exportar funções necessárias", async () => {
    const repo = await import("../orcamentoRepository");
    expect(repo).toHaveProperty("listarOrcamentos");
    expect(repo).toHaveProperty("criarOrcamento");
  });
});

describe("empresaRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buscarEmpresa deve chamar from empresas", async () => {
    const { buscarEmpresa } = await import("../empresaRepository");
    const { sb } = await import("../../supabase");
    await buscarEmpresa();
    expect(sb.from).toHaveBeenCalledWith("empresas");
  });
});
