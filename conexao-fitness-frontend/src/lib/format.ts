export function formatBRL(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(iso));
}

export function formatDateLong(iso: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatBookingSchedule(iso: string, isDayPass: boolean = false) {
  const dateFormatted = formatDateLong(iso);
  if (isDayPass) {
    return `${dateFormatted} • Acesso Livre (Dia Todo)`;
  }
  const timeFormatted = formatTime(iso);
  return `${dateFormatted} às ${timeFormatted}`;
}
