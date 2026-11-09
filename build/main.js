#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { ALEGRA_ENDPOINTS, requestAlegra } from './alegra-api.js';
import { logger } from './logger.js';
const endpointSchema = z.enum(ALEGRA_ENDPOINTS)
    .describe('Recurso de Alegra, por ejemplo invoices, contacts o items.');
const idSchema = z.string().min(1).optional()
    .describe('Identificador del registro; omítalo para consultar o crear colecciones.');
const queryParamsSchema = z.record(z.string(), z.unknown()).optional()
    .describe('Parámetros de consulta para GET/DELETE o cuerpo JSON para POST/PUT/PATCH.');
const readInputSchema = z.object({
    endpoint: endpointSchema,
    id: idSchema,
    queryParams: queryParamsSchema,
});
const writeInputSchema = z.object({
    endpoint: endpointSchema,
    method: z.enum(['post', 'put', 'patch'])
        .describe('POST crea; PUT reemplaza; PATCH actualiza parcialmente.'),
    id: idSchema,
    queryParams: queryParamsSchema,
});
const deleteInputSchema = z.object({
    endpoint: endpointSchema,
    id: z.string().min(1).describe('Identificador del registro que se eliminará.'),
    queryParams: queryParamsSchema,
});
const legacyInputSchema = z.object({
    endpoint: endpointSchema,
    method: z.enum(['get', 'post', 'put', 'patch', 'delete']).default('get'),
    id: idSchema,
    queryParams: queryParamsSchema,
});
function toolError(error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Falló la solicitud a Alegra', {
        error: error instanceof Error ? error.name : 'UnknownError',
    });
    return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
    };
}
function createServer() {
    const server = new McpServer({ name: 'Alegra-MCP', version: '2.0.0' }, { maxToolInputElements: 10_000 });
    server.registerPrompt('ultimas-facturas', {
        title: 'Listar las 5 facturas de venta más recientes',
        description: 'Solicita las últimas 5 facturas emitidas.',
    }, () => ({
        messages: [{
                role: 'user',
                content: { type: 'text', text: 'Muéstrame las últimas 5 facturas de venta.' },
            }],
    }));
    server.registerPrompt('buscar-contacto', {
        title: 'Buscar un contacto por su nombre',
        description: 'Busca un cliente específico por nombre.',
    }, () => ({
        messages: [{
                role: 'user',
                content: { type: 'text', text: 'Encuentra el contacto con el nombre "Cliente Ejemplo S.A.S".' },
            }],
    }));
    server.registerPrompt('detalle-item', {
        title: 'Obtener detalles de un ítem por su ID',
        description: 'Recupera un producto o servicio por su identificador.',
    }, () => ({
        messages: [{
                role: 'user',
                content: { type: 'text', text: 'Obtén los detalles del ítem con ID 15.' },
            }],
    }));
    server.registerPrompt('borrador-factura', {
        title: 'Crear un borrador de factura de venta',
        description: 'Prepara un borrador con el cliente y el ítem indicados.',
    }, () => ({
        messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: 'Crea un borrador de factura para el cliente con ID 1, con el ítem de ID 4 (cantidad 2, precio 50000).',
                },
            }],
    }));
    server.registerPrompt('cuentas-bancarias', {
        title: 'Listar las cuentas bancarias',
        description: 'Consulta las cuentas bancarias registradas.',
    }, () => ({
        messages: [{
                role: 'user',
                content: { type: 'text', text: 'Lista todas las cuentas bancarias registradas.' },
            }],
    }));
    server.registerTool('alegra_read', {
        title: 'Consultar Alegra',
        description: 'Consulta una colección o un registro de Alegra sin modificar datos.',
        inputSchema: readInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async ({ endpoint, id, queryParams }) => {
        try {
            const text = await requestAlegra({ endpoint, method: 'get', id, queryParams });
            return { content: [{ type: 'text', text }] };
        }
        catch (error) {
            return toolError(error);
        }
    });
    server.registerTool('alegra_write', {
        title: 'Crear o actualizar en Alegra',
        description: 'Crea o modifica un registro de Alegra mediante POST, PUT o PATCH.',
        inputSchema: writeInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, async ({ endpoint, method, id, queryParams }) => {
        try {
            const text = await requestAlegra({ endpoint, method, id, queryParams });
            return { content: [{ type: 'text', text }] };
        }
        catch (error) {
            return toolError(error);
        }
    });
    server.registerTool('alegra_delete', {
        title: 'Eliminar un registro de Alegra',
        description: 'Elimina un registro específico. Requiere el ID del registro.',
        inputSchema: deleteInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, async ({ endpoint, id, queryParams }) => {
        try {
            const text = await requestAlegra({ endpoint, method: 'delete', id, queryParams });
            return { content: [{ type: 'text', text }] };
        }
        catch (error) {
            return toolError(error);
        }
    });
    server.registerTool('AlegraAPI', {
        title: 'Alegra API (compatibilidad heredada)',
        description: 'Herramienta heredada. Para nuevas integraciones usa alegra_read, alegra_write o alegra_delete.',
        inputSchema: legacyInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, async ({ endpoint, method, id, queryParams }) => {
        try {
            const text = await requestAlegra({
                endpoint,
                method,
                id,
                queryParams,
            });
            return { content: [{ type: 'text', text }] };
        }
        catch (error) {
            return toolError(error);
        }
    });
    return server;
}
logger.info('Iniciando servidor MCP para Alegra');
const handle = serveStdio(createServer, { legacy: 'reject' });
process.on('SIGINT', () => {
    void handle.close();
});
process.on('SIGTERM', () => {
    void handle.close();
});
