import React, { useState, useEffect, useRef } from 'react';
import { sb, getEmpresaId } from '../../services/supabase';
import { SF_COMP, SF_PRECOS, SF_CATS, SF_LABELS, SF_UNIDADES } from '../../utils/sf-orcamento';

const SUB_TABS = ['Preços', 'Composições'];

function fmtPreco(v) {
  return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ConfigSFTab() {
  const [subTab, setSubTab] = useState('Preços');
  const [precos, setPrecos] = useState(() => ({ ...SF_PRECOS }));
  const [composicoes, setComposicoes] = useState(() => SF_COMP.map((c) => ({ ...c })));
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);
  const recordId = useRef(null);

  // Load on mount
  useEffect(() => {
    const empId = getEmpresaId();
    if (!empId) return;
    sb.from('sf_orcamentos')
      .select('*')
      .eq('empresa_id', empId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const row = data[0];
          recordId.current = row.id;
          const d = row.data || {};
          if (d.precos) setPrecos((prev) => ({ ...prev, ...d.precos }));
          if (d.composicoes) setComposicoes(d.composicoes);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-save with debounce
  function scheduleSave(newPrecos, newComps) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const empId = getEmpresaId();
      if (!empId) return;
      try {
        // Load current data first to preserve projetos
        let existing = {};
        if (recordId.current) {
          const { data } = await sb.from('sf_orcamentos').select('data').eq('id', recordId.current).single();
          existing = data?.data || {};
        }
        const payload = {
          empresa_id: empId,
          data: { ...existing, precos: newPrecos, composicoes: newComps },
          updated_at: new Date().toISOString(),
        };
        let res;
        if (recordId.current) {
          res = await sb.from('sf_orcamentos').update(payload).eq('id', recordId.current);
        } else {
          res = await sb.from('sf_orcamentos').insert(payload).select().single();
          if (res.data) recordId.current = res.data.id;
        }
        // Also persist to localStorage as fallback
        localStorage.setItem('sf_precos', JSON.stringify(newPrecos));
        localStorage.setItem('sf_composicoes', JSON.stringify(newComps));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (_) {}
    }, 1500);
  }

  function updatePreco(key, value) {
    const next = { ...precos, [key]: parseFloat(value) || 0 };
    setPrecos(next);
    scheduleSave(next, composicoes);
  }

  function updateComp(idx, field, value) {
    const next = composicoes.map((c, i) => {
      if (i !== idx) return c;
      return { ...c, [field]: field === 'esp' ? (parseInt(value) || 300) : value };
    });
    setComposicoes(next);
    scheduleSave(precos, next);
  }

  const inp = {
    padding: '8px 12px',
    border: '1px solid var(--line,#e7e1d8)',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    background: 'var(--surface-2,#faf8f4)',
    color: 'var(--ink,#26231f)',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {SUB_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            style={{
              padding: '7px 18px', fontSize: 12, fontWeight: subTab === t ? 700 : 400,
              background: subTab === t ? 'var(--brick,#981915)' : 'transparent',
              color: subTab === t ? '#fff' : 'var(--muted,#8c847a)',
              border: `1px solid ${subTab === t ? 'var(--brick,#981915)' : 'var(--line,#e7e1d8)'}`,
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}
          >
            {t}
          </button>
        ))}
        {saved && (
          <span style={{ marginLeft: 12, fontSize: 12, color: '#3f7a4b', fontWeight: 700, alignSelf: 'center' }}>
            Salvo 
          </span>
        )}
      </div>

      {/*  Preços  */}
      {subTab === 'Preços' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(SF_CATS).map(([cat, keys]) => (
            <div key={cat} style={{ background: '#fff', border: '1px solid var(--line,#e7e1d8)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', background: 'var(--surface-2,#faf8f4)', borderBottom: '1px solid var(--line,#e7e1d8)', fontSize: 12, fontWeight: 800, color: 'var(--ink,#26231f)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {cat}
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {keys.map((key) => (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr auto 140px', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#26231f)' }}>{SF_LABELS[key]}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted,#8c847a)', marginTop: 2 }}>{SF_UNIDADES[key]}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted,#8c847a)', fontWeight: 700 }}>R$/un</div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precos[key] ?? ''}
                      onChange={(e) => updatePreco(key, e.target.value)}
                      style={inp}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/*  Composições  */}
      {subTab === 'Composições' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {composicoes.map((comp, idx) => (
            <div key={comp.id} style={{ background: '#fff', border: '1px solid var(--line,#e7e1d8)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink,#26231f)', marginBottom: 14 }}>{comp.nome}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted,#8c847a)', fontWeight: 600 }}>Espaçamento (mm)</div>
                  <input
                    type="number"
                    min="300"
                    max="600"
                    step="50"
                    value={comp.esp}
                    onChange={(e) => updateComp(idx, 'esp', e.target.value)}
                    style={inp}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted,#8c847a)', fontWeight: 600 }}>Membrana impermeab.</div>
                  <input
                    type="checkbox"
                    checked={!!comp.mem}
                    onChange={(e) => updateComp(idx, 'mem', e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted,#8c847a)', fontWeight: 600 }}>Isolamento (lã de vidro)</div>
                  <input
                    type="checkbox"
                    checked={!!comp.iso}
                    onChange={(e) => updateComp(idx, 'iso', e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  <div style={{ padding: '8px 10px', background: 'var(--surface-2,#faf8f4)', borderRadius: 7, fontSize: 11 }}>
                    <div style={{ color: 'var(--muted,#8c847a)', marginBottom: 2 }}>Tipo INT</div>
                    <div style={{ fontWeight: 700, color: 'var(--ink,#26231f)' }}>{comp.pInt?.tipo || '—'}</div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--surface-2,#faf8f4)', borderRadius: 7, fontSize: 11 }}>
                    <div style={{ color: 'var(--muted,#8c847a)', marginBottom: 2 }}>Tipo EXT</div>
                    <div style={{ fontWeight: 700, color: 'var(--ink,#26231f)' }}>{comp.pExt?.tipo || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConfigSFTab;
