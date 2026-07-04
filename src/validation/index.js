/**
 * StickFEM™ Validation Framework™ — índice dos casos de referência.
 * Cada caso = modelo + resultado esperado (golden validado). Consumido pela
 * suíte de regressão e pelo painel de Validação Técnica.
 */
import parede_3m from "./reference_models/parede_3m.json";
import parede_6m from "./reference_models/parede_6m.json";
import shed_12x30 from "./reference_models/shed_12x30.json";
import sobrado from "./reference_models/sobrado.json";
import galpao from "./reference_models/galpao.json";

import exp_parede_3m from "./expected_results/parede_3m.expected.json";
import exp_parede_6m from "./expected_results/parede_6m.expected.json";
import exp_shed from "./expected_results/shed_12x30.expected.json";
import exp_sobrado from "./expected_results/sobrado.expected.json";
import exp_galpao from "./expected_results/galpao.expected.json";

export const CASOS_REFERENCIA = [
  { model: parede_3m, expected: exp_parede_3m },
  { model: parede_6m, expected: exp_parede_6m },
  { model: shed_12x30, expected: exp_shed },
  { model: sobrado, expected: exp_sobrado },
  { model: galpao, expected: exp_galpao },
];
