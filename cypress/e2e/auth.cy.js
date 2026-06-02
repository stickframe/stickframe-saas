describe("Autenticação", () => {
  it("exibe a tela de login", () => {
    cy.visit("/");
    cy.get('input[type="email"]').should("exist");
    cy.get('input[type="password"]').should("exist");
  });

  it("bloqueia login com credenciais inválidas", () => {
    cy.visit("/");
    cy.get('input[type="email"]').type("invalido@test.com");
    cy.get('input[type="password"]').type("senha_errada");
    cy.get("button").contains(/entrar|login/i).click();
    cy.get('input[type="email"]').should("exist");
  });

  it("realiza login com credenciais válidas", () => {
    const email = Cypress.env("TEST_EMAIL");
    const password = Cypress.env("TEST_PASSWORD");
    if (!email || !password) {
      cy.log("Credenciais de teste não configuradas — pulando");
      return;
    }
    cy.login(email, password);
    cy.visit("/");
    cy.get("nav, aside, [class*='sidebar']", { timeout: 15000 }).should("exist");
  });
});
