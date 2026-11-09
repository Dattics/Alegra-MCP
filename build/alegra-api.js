import { getAlegraAuthHeaders } from './auth.js';
import { logger } from './logger.js';
export const ALEGRA_ENDPOINTS = [
    'invoices',
    'contacts',
    'items',
    'credit-notes',
    'remissions',
    'purchase-orders',
    'estimates',
    'income-debit-notes',
    'global-invoices',
    'transportation-receipts',
    'recurring-invoices',
    'payments',
    'bills',
    'debit-notes',
    'recurring-payments',
    'warehouses',
    'warehouse-transfers',
    'inventory-adjustments',
    'price-lists',
    'custom-fields',
    'variant-attributes',
    'item-categories',
    'sellers',
    'categories',
    'cost-centers',
    'journals',
    'bank-accounts',
    'reconciliations',
    'taxes',
    'retentions',
    'currencies',
    'terms',
    'company',
    'users',
    'number-templates',
    'webhooks-subscriptions',
    'additional-charges',
];
const BASE_URL = 'https://api.alegra.com/api/v1/';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ERROR_LENGTH = 2_000;
function appendQueryValue(params, key, value) {
    if (value === null || value === undefined) {
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            appendQueryValue(params, key, item);
        }
        return;
    }
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (serialized !== undefined) {
        params.append(key, serialized);
    }
}
export async function requestAlegra(request, fetchImpl = fetch) {
    const { endpoint, method, id, queryParams } = request;
    const url = new URL(endpoint, BASE_URL);
    if (id) {
        url.pathname += `/${encodeURIComponent(id)}`;
    }
    if (method === 'get' || method === 'delete') {
        for (const [key, value] of Object.entries(queryParams ?? {})) {
            appendQueryValue(url.searchParams, key, value);
        }
    }
    const options = {
        method: method.toUpperCase(),
        headers: getAlegraAuthHeaders(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };
    if (method === 'post' || method === 'put' || method === 'patch') {
        options.body = JSON.stringify(queryParams ?? {});
    }
    logger.info('Solicitud a Alegra', { method: options.method, endpoint });
    const response = await fetchImpl(url, options);
    const body = await response.text();
    logger.info('Respuesta de Alegra', { method: options.method, endpoint, status: response.status });
    if (!response.ok) {
        const details = body.length > MAX_ERROR_LENGTH
            ? `${body.slice(0, MAX_ERROR_LENGTH)}…`
            : body;
        throw new Error(`La API de Alegra respondió ${response.status} ${response.statusText}${details ? `: ${details}` : ''}`);
    }
    if (!body) {
        return 'La solicitud se completó correctamente. Alegra no devolvió contenido.';
    }
    try {
        return JSON.stringify(JSON.parse(body), null, 2);
    }
    catch {
        return body;
    }
}
