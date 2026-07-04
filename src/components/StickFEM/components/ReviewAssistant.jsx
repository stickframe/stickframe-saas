import { useState, useMemo } from 'react';

const BTN_GHOST = { background: "var(--surface)", color: "var(--text-muted, #57514a)", border: "1.5px solid var(--line)", borderRadius: 8, padding: "8px 14px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const BTN_PRIMARY = { background: "var(--red, #981915)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" };

/**
 * Painel Assistente de Revisão (Fase 4)
 * Guia o engenheiro pelos itens que precisam de atenção no modelo.
 */
const ReviewAssistant = ({ elementos, conflitos, onElementSelect }) => {
  const [indiceAtual, setIndiceAtual] = useState(0);

  const itensParaRevisar = useMemo(() => {
    const elementosComProblema = elementos
      .map((el, index) => ({ ...el, originalIndex: index }))
      .filter(el => el.confianca === 'baixa' || el.confianca === 'media');
    
    // Futuramente, podemos adicionar os conflitos como itens de revisão também
    return elementosComProblema;
  }, [elementos]);

  const totalOk = elementos.length - itensParaRevisar.length;
  const totalRevisao = itensParaRevisar.length;
  const totalInconsistencias = conflitos.length;

  const itemAtual = itensParaRevisar[indiceAtual];

  const irPara = (direcao) => {
    const novoIndice = indiceAtual + direcao;
    if (novoIndice >= 0 && novoIndice < totalRevisao) {
      setIndiceAtual(novoIndice);
      if (onElementSelect) {
        onElementSelect(itensParaRevisar[novoIndice]);
      }
    }
  };

  const aceitarSugestao = () => {
    // Lógica para aceitar a sugestão (ex: marcar como validado)
    console.log(`Aceitando sugestão para o elemento: ${itemAtual?.nome}`);
    // Aqui chamaríamos uma função passada por props para atualizar o elemento
    irPara(1); // Avança para o próximo
  };

  if (totalRevisao === 0 && totalInconsistencias === 0) {
    return (
      <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 10px 0', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700 }}>Assistente de Revisão</h3>
        <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>✅ Todos os elementos estão consistentes.</p>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 10px 0', fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700 }}>Assistente de Revisão</h3>
      
      <div style={{ fontSize: 13, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ color: '#22c55e' }}>✔ {totalOk} elementos OK</span>
        <span style={{ color: '#f59e0b' }}>⚠ {totalRevisao} precisam de revisão</span>
        <span style={{ color: '#ef4444' }}>❌ {totalInconsistencias} inconsistências</span>
      </div>

      {itemAtual && (
        <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', marginBottom: 12 }}>
          <h4 style={{ fontWeight: 'bold', margin: '0 0 8px 0', fontSize: 14 }}>Revisar Elemento: {itemAtual.nome}</h4>
          <p style={{ fontSize: 12, margin: '2px 0', color: 'var(--muted)' }}>Tipo: {itemAtual.tipo}</p>
          <p style={{ fontSize: 12, margin: '2px 0', color: 'var(--muted)' }}>Confiança: <span style={{ color: itemAtual.confianca === 'baixa' ? '#ef4444' : '#f59e0b' }}>{itemAtual.confianca}</span></p>
          <p style={{ fontSize: 12, margin: '2px 0', color: 'var(--muted)' }}>Layer: {itemAtual.layer_origem}</p>
          
          {itemAtual.sugestaoPerfil && (
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
              <p style={{ fontSize: 13, margin: '0 0 4px 0', fontWeight: 'bold', color: 'var(--blue)' }}>
                Sugestão de Perfil: {itemAtual.sugestaoPerfil.perfil_nome_sugerido}
              </p>
              <p style={{ fontSize: 11, margin: 0, color: 'var(--muted)' }}>
                {itemAtual.sugestaoPerfil.explicacao}
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        <button onClick={() => irPara(-1)} disabled={indiceAtual === 0} style={BTN_GHOST}>Anterior</button>
        <button onClick={() => irPara(1)} disabled={indiceAtual >= totalRevisao - 1} style={BTN_GHOST}>Próximo</button>
      </div>
      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
        <button onClick={aceitarSugestao} style={{ ...BTN_PRIMARY, flex: 1, background: 'var(--success)' }}>Aceitar Sugestão</button>
        <button style={{ ...BTN_GHOST, flex: 1 }}>Corrigir Manualmente</button>
      </div>
    </div>
  );
};

export default ReviewAssistant;
