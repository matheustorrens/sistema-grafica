/**
 * Application Constants
 * 
 * Global constants used throughout the application.
 * For environment-specific values, use env.ts instead.
 */

// API Configuration
export const API_RETRY_COUNT = 3;
export const API_RETRY_DELAY = 1000; // milliseconds

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Date/Time formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Currency
export const CURRENCY = 'BRL';
export const CURRENCY_LOCALE = 'pt-BR';

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

// WhatsApp
export const WHATSAPP_BASE_URL = 'https://wa.me';

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'printmaster_theme',
  SETTINGS: 'printmaster_settings',
  ORDERS_CACHE: 'printmaster_orders',
  MATERIALS_CACHE: 'printmaster_materials',
  SUPPLIERS_CACHE: 'printmaster_suppliers',
} as const;

// Default values
export const DEFAULTS = {
  COMPANY_NAME: 'Minha Gráfica',
  PRIMARY_COLOR: '#4f46e5', // Indigo-600
  MESSAGE_TEMPLATE: 'Olá {fornecedor}, preciso repor o estoque de *{material}*. Tem disponível?',
  BILLING_TEMPLATE: `Olá {cliente}, seu pedido #{pedido} no valor de {valor} está aguardando pagamento/conclusão.

Chave PIX: {pix}

Aguardo o comprovante!`,
} as const;
