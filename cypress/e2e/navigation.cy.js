const PAGES = [
  { label: /dashboard/i },
  { label: /crm|cliente/i },
  { label: /obras/i },
  { label: /financeiro/i },
  { label: /equipe/i },
  { label: /orçamento|orcamento/i },
];

describe("Navegação principal", () => {
  before(function () {
    const email = Cypress.env("TEST_EMAIL");
    const password = Cypress.env("TEST_PASSWORD");
    if (!email || !password) {
      cy.log("Credenciais não configuradas — pulando testes de navegação");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.login(Cypress.env("TEST_EMAIL"), Cypress.env("TEST_PASSWORD"));
    cy.visit("/");
  });

  PAGES.forEach(({ label }) => {
    it(`carrega a página ${label}`, () => {
      cy.get("nav a, aside button, [class*='nav'] button")
        .contains(label)
        .click();
      cy.get("body").should("not.contain.text", "TypeError");
      cy.get("body").should("not.contain.text", "Cannot read");
    });
  });
});
