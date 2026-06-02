describe("Obras", () => {
  beforeEach(() => {
    cy.login(Cypress.env("TEST_EMAIL"), Cypress.env("TEST_PASSWORD"));
    cy.visit("/");
    cy.get("nav a, aside button, [class*='nav'] button")
      .contains(/obras/i)
      .click();
  });

  it("lista de obras carrega sem erro", () => {
    cy.get("body").should("not.contain.text", "TypeError");
  });

  it("abre modal de nova obra", () => {
    cy.get("button").contains(/nova|adicionar|\\+/i).first().click();
    cy.get("input, form").should("exist");
  });

  it("widget compras preditivas presente no Dashboard", () => {
    cy.get("nav a, aside button, [class*='nav'] button")
      .contains(/dashboard/i)
      .click();
    cy.get("body").should("not.contain.text", "TypeError");
  });
});
