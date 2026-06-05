// Teste da calculadora pública — roda contra o preview local (localhost:4173)
// NÃO cria dados em produção pois baseUrl aponta para o servidor de preview

describe('Fluxo Crítico: Calculadora Pública', () => {
  it('Deve preencher a simulação e exibir estimativa sem criar lead real', () => {
    cy.visit('/calcular', { failOnStatusCode: false });

    // Se já estiver na tela de sucesso de sessão anterior, volta
    cy.get('body').then(($body) => {
      if ($body.text().includes('Recebemos seu contato')) {
        cy.contains('Fazer outra simulação').click();
      }
    });

    cy.contains('Calcule o custo da sua obra', { timeout: 20000 }).should('be.visible');

    // Passo 1: preenche área e padrão
    cy.get('input[type="number"]').clear().type('150');
    cy.contains('Alto Padrão').click();
    cy.get('button[type="submit"]').contains('Calcular agora').click();

    // Passo 2: só valida que a estimativa aparece — NÃO submete o formulário de lead
    cy.contains('Sua estimativa está pronta!', { timeout: 15000 }).should('be.visible');

    // Verifica que os campos de contato existem (smoke test de UI)
    cy.get('input[type="text"]').first().should('exist');
    cy.get('input[type="tel"]').should('exist');

    // Não submete — evita criar dados em produção
  });
});
