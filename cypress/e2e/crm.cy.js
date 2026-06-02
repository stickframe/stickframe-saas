describe("CRM — Clientes", () => {
  beforeEach(() => {
    cy.login(Cypress.env("TEST_EMAIL"), Cypress.env("TEST_PASSWORD"));
    cy.visit("/");
    cy.get("nav a, aside button, [class*='nav'] button")
      .contains(/crm|cliente/i)
      .click();
  });

  it("lista de clientes carrega sem erro", () => {
    cy.get("body").should("not.contain.text", "TypeError");
    cy.get("[class*='card'], [class*='list'], table, ul").should("exist");
  });

  it("abre modal de novo cliente", () => {
    cy.get("button").contains(/novo|adicionar|\\+/i).first().click();
    cy.get("input, form").should("exist");
  });
});
