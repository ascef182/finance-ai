import { addMonths, startOfMonth } from "date-fns";

/**
 * Retorna o intervalo [gte, lt) correto para um determinado mês.
 * Substitui a lógica antiga com ano fixo "2024" e dia "31" hardcoded,
 * que quebrava em meses com 30 dias / fevereiro e só funcionava em 2024.
 *
 * @param month string no formato "MM" (ex.: "01" a "12")
 * @param year  ano de 4 dígitos; por padrão usa o ano atual
 */
export const getMonthDateRange = (
  month: string,
  year: number = new Date().getFullYear(),
) => {
  const monthIndex = Number(month) - 1;
  const gte = startOfMonth(new Date(year, monthIndex, 1));
  const lt = addMonths(gte, 1);
  return { gte, lt };
};
