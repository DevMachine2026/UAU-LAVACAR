export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Nao foi possivel concluir a operacao.";
}

export function toNumber(value: string) {
  if (value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}

export function toBoolean(value: string) {
  return value === "true";
}
