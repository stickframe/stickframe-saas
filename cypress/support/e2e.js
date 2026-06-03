import "./commands";

// Ignora erros não capturados da aplicação (ex: Supabase key missing em preview)
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("supabaseKey") || err.message.includes("supabase")) {
    return false;
  }
  return true;
});
