Cypress.Commands.add("login", (email, password) => {
  cy.session(
    [email, password],
    () => {
      cy.visit("/");
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.get("button").contains(/entrar|login/i).click();
      cy.url().should("not.include", "login");
      cy.get("nav, aside, [class*='sidebar']", { timeout: 15000 }).should("exist");
    },
    {
      cacheAcrossSpecs: true,
    }
  );
});
