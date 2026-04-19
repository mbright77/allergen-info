import { i18n } from './init'

function getLocale(locale?: string) {
  return locale ?? i18n.resolvedLanguage ?? i18n.language ?? 'en'
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions, locale?: string) {
  return new Intl.NumberFormat(getLocale(locale), options).format(value)
}

export function formatDate(value: Date | string | number, options?: Intl.DateTimeFormatOptions, locale?: string) {
  return new Intl.DateTimeFormat(getLocale(locale), options).format(new Date(value))
}

export function formatTime(value: Date | string | number, options?: Intl.DateTimeFormatOptions, locale?: string) {
  return new Intl.DateTimeFormat(getLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(new Date(value))
}

export function formatDateTime(value: Date | string | number, options?: Intl.DateTimeFormatOptions, locale?: string) {
  return new Intl.DateTimeFormat(getLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(value))
}
