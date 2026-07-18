// Converte números inteiros em texto por extenso (português do Brasil).
// Suporta valores de 0 até 999.999.999. Usado pelos tipos de campo
// 'valorPorExtenso' (com "reais"/"centavos") e 'numeroPorExtenso' (puro).

const UNIDADES = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
];
const DEZ_A_DEZENOVE = [
  'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis',
  'dezessete', 'dezoito', 'dezenove',
];
const DEZENAS = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta',
  'oitenta', 'noventa',
];
const CENTENAS = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
];

function threeDigitsToWords(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const c = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];

  if (c > 0) parts.push(CENTENAS[c]);

  if (rest > 0) {
    if (rest < 10) {
      parts.push(UNIDADES[rest]);
    } else if (rest < 20) {
      parts.push(DEZ_A_DEZENOVE[rest - 10]);
    } else {
      const d = Math.floor(rest / 10);
      const u = rest % 10;
      parts.push(u > 0 ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
    }
  }

  return parts.join(' e ');
}

// Quebra o número em grupos de 3 dígitos (unidades, milhares, milhões)
// e junta com os separadores certos ("mil", "milhões", "e" quando cabe).
export function numberToWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'zero';
  if (n > 999999999) return String(n); // fora do suporte, devolve cru

  const milhoes = Math.floor(n / 1000000);
  const milhares = Math.floor((n % 1000000) / 1000);
  const unidades = n % 1000;

  const segments: string[] = [];

  if (milhoes > 0) {
    const texto = threeDigitsToWords(milhoes);
    segments.push(milhoes === 1 ? `${texto} milhão` : `${texto} milhões`);
  }

  if (milhares > 0) {
    const texto = milhares === 1 ? '' : threeDigitsToWords(milhares);
    segments.push(milhares === 1 ? 'mil' : `${texto} mil`);
  }

  if (unidades > 0) {
    // "e" antes do último grupo quando ele é < 100 (regra comum de
    // extenso em pt-BR) ou quando é uma centena "redonda"
    const precisaE = unidades < 100 || unidades % 100 === 0;
    segments.push((precisaE && segments.length > 0 ? 'e ' : '') + threeDigitsToWords(unidades));
  }

  return segments.join(' ');
}

// Formata um valor monetário (aceita string com vírgula/ponto) em
// texto por extenso com "reais" e "centavos".
export function currencyToWords(rawValue: string): string {
  const normalized = rawValue.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const value = parseFloat(normalized);
  if (isNaN(value)) return '';

  const reais = Math.floor(value);
  const centavos = Math.round((value - reais) * 100);

  const reaisTexto = reais === 0 ? '' : `${numberToWords(reais)} ${reais === 1 ? 'real' : 'reais'}`;
  const centavosTexto =
    centavos === 0 ? '' : `${numberToWords(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;

  if (reaisTexto && centavosTexto) return `${reaisTexto} e ${centavosTexto}`;
  if (reaisTexto) return reaisTexto;
  if (centavosTexto) return centavosTexto;
  return 'zero reais';
}

// Formata um número inteiro (aceita string) em texto por extenso puro,
// sem "reais"/"centavos".
export function plainNumberToWords(rawValue: string): string {
  const normalized = rawValue.replace(/[^\d-]/g, '');
  const value = parseInt(normalized, 10);
  if (isNaN(value)) return '';
  return numberToWords(value);
}