// Formata o valor de campos de numeração automática, respeitando a
// quantidade de dígitos (com zeros à esquerda) configurada pelo usuário.

import type { AutoIncrementConfig, Template } from '../types/template';

export const DEFAULT_AUTO_INCREMENT_CONFIG: AutoIncrementConfig = {
  digits: 1,
  startAt: 1,
};

export function formatAutoIncrement(rawNumber: number, config: AutoIncrementConfig): string {
  return String(rawNumber).padStart(config.digits, '0');
}

// Calcula qual é o próximo número "cru" (sem padding) que deve ser
// usado, considerando o startAt configurado no campo e o contador já
// avançado no template (se ainda não tiver rodado nenhuma vez, usa
// startAt; se já tiver contador salvo, usa o maior entre os dois pra
// não "voltar" caso o usuário diminua o startAt depois).
export function nextAutoIncrementNumber(template: Template, config: AutoIncrementConfig): number {
  const counter = template.autoIncrementCounter;
  if (counter === undefined) return config.startAt;
  return Math.max(counter, config.startAt);
}