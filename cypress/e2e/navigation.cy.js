const PAGES = [
  { label: /dashboard/i, key: "dashboard" },
  { label: /crm|cliente/i, key: "crm" },
  { label: /obras/i, key: "obras" },
  { label: /financeiro/i, key: "financeiro" },
  { label: /equipe/i, key: "equipe" },
  { label: /orçamento|orcamento/i, key: "orcamentos" },
];

describe("Navegação principal", () => {
  beforeEach(() => {
    cy.login(Cypress.env("TEST_EMAIL"), Cypress.env("TEST_PASSWORD"));
    cy.visit("/");
  });

  PAGES.forEach(({ label }) => {
    it(`carrega a página ${label}`, () => {
      cy.get("nav a, aside button, [class*='nav'] button")
        .contains(label)
        .click();
      cy.get("[class*='loading'], [class*='spinner']", { timeout: 3000 })
        .should("not.exist");
      cy.get("body").should("not.contain.text", "TypeError");
      cy.get("body").should("not.contain.text", "Cannot read");
    });
  });
});
