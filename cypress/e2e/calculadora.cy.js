describe('Fluxo Crítico: Calculadora Pública', () => {
  it('Deve preencher a simulação e gerar um lead com sucesso', () => {
    // 1. Acessa a página da calculadora (lazy loaded, timeout maior)
    cy.visit('/calcular');
    cy.contains('Calcule o custo da sua obra', { timeout: 20000 }).should('be.visible');

    // 2. Preenche o Passo 1 (Área, Padrão, etc)
    cy.get('input[type="number"]').clear().type('150');
    cy.contains('Alto Padrão').click();
    cy.get('button[type="submit"]').contains('Calcular agora').click();

    // 3. Valida se chegou no Passo 2 e preenche os dados do Lead
    cy.contains('Sua estimativa está pronta!', { timeout: 15000 }).should('be.visible');

    // Digita o Nome (primeiro input de texto)
    cy.get('input[type="text"]').first().type('João Teste Cypress');

    // Digita o WhatsApp (input tipo tel)
    cy.get('input[type="tel"]').type('11999999999');

    // Submete o formulário de captação
    cy.get('button[type="submit"]').contains('Receber proposta grátis').click();

    // 4. Garante que chegou na tela de Sucesso Final
    cy.contains('Recebemos seu contato!', { timeout: 15000 }).should('be.visible');
    cy.contains('11999999999').should('be.visible');
  });
});
