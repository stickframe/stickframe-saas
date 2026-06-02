describe("Financeiro", () => {
  beforeEach(() => {
    cy.login(Cypress.env("TEST_EMAIL"), Cypress.env("TEST_PASSWORD"));
    cy.visit("/");
    cy.get("nav a, aside button, [class*='nav'] button")
      .contains(/financeiro/i)
      .click();
  });

  it("página carrega sem erro", () => {
    cy.get("body").should("not.contain.text", "TypeError");
  });

  it("aba Fluxo de Caixa renderiza", () => {
    cy.get("button").contains(/fluxo de caixa/i).click();
    cy.get("svg").should("exist");
  });

  it("abre modal de lançamento", () => {
    cy.get("button").contains(/receita|despesa|lançamento|novo/i).first().click();
    cy.get("input, form").should("exist");
  });
});
