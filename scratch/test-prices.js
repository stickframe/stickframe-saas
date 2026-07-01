import { PRECOS } from "../src/utils/constants.js";

// Mock do localStorage para ambiente Node
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  clear() {
    this.store = {};
  }
};

console.log("=== TESTANDO VALORES DEFAULT ===");
console.log("Econômico (esperado 2800):", PRECOS["Econômico"]?.m2);
console.log("Padrão (esperado 3500):", PRECOS["Padrão"]?.m2);
console.log("Alto Padrão (esperado 4800):", PRECOS["Alto Padrão"]?.m2);

console.log("\n=== SIMULANDO SALVAMENTO DE NOVOS PREÇOS ===");
const novosPrecos = {
  "Econômico":   { label: "Econômico",   m2: 3200 },
  "Padrão":      { label: "Padrão",      m2: 4200 },
  "Alto Padrão": { label: "Alto Padrão", m2: 6600 }
};

localStorage.setItem("sf_precos_m2", JSON.stringify(novosPrecos));

console.log("\n=== TESTANDO VALORES APÓS SALVAMENTO ===");
console.log("Econômico (esperado 3200):", PRECOS["Econômico"]?.m2);
console.log("Padrão (esperado 4200):", PRECOS["Padrão"]?.m2);
console.log("Alto Padrão (esperado 6600):", PRECOS["Alto Padrão"]?.m2);

if (PRECOS["Padrão"]?.m2 === 4200) {
  console.log("\n✅ SUCESSO: O proxy PRECOS está lendo e aplicando os valores salvos corretamente!");
} else {
  console.log("\n❌ FALHA: O proxy não aplicou os novos valores.");
}
