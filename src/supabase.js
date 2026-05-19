import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const auth = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  },

  async signOut() {
    await supabase.auth.signOut()
  },

  async getUser() {
    const { data } = await supabase.auth.getUser()
    return data?.user ?? null
  },

  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
  },
}

// ── CLIENTES ──────────────────────────────────────────────────────────────────
export const db = {
  async getClientes() {
    const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async insertCliente(cliente) {
    const { data, error } = await supabase.from('clientes').insert(cliente).select().single()
    if (error) throw error
    return data
  },

  // ── ORÇAMENTOS ──────────────────────────────────────────────────────────────
  async getOrcamentos() {
    const { data, error } = await supabase.from('orcamentos').select('*, clientes(nome)').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async insertOrcamento(orc) {
    const { data, error } = await supabase.from('orcamentos').insert(orc).select().single()
    if (error) throw error
    return data
  },

  // ── OBRAS ───────────────────────────────────────────────────────────────────
  async getObras() {
    const { data, error } = await supabase.from('obras').select('*, clientes(nome)').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async updateObra(id, updates) {
    const { error } = await supabase.from('obras').update(updates).eq('id', id)
    if (error) throw error
  },

  // ── FINANCEIRO ──────────────────────────────────────────────────────────────
  async getLancamentos(obraId) {
    const { data, error } = await supabase.from('lancamentos').select('*').eq('obra_id', obraId).order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async insertLancamento(lanc) {
    const { data, error } = await supabase.from('lancamentos').insert(lanc).select().single()
    if (error) throw error
    return data
  },
}
