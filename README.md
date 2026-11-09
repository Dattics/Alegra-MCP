# Alegra MCP

Servidor local del [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) para consultar y administrar recursos de la API de Alegra.
Usa el SDK TypeScript v2 y el transporte estándar `stdio`. Solo acepta el protocolo moderno MCP `2026-07-28`; los clientes legacy son rechazados.
La salida estándar queda reservada para el protocolo.

## Requisitos

- Node.js 20 o posterior.
- Usuario y token de API de Alegra.

## Configuración en un cliente MCP

Configura las credenciales como variables de entorno del proceso. Por ejemplo, en VS Code:

```json
{
  "servers": {
    "Alegra": {
      "command": "npx",
      "args": ["-y", "@juancsanchez/alegra-mcp"],
      "env": {
        "ALEGRA_USER": "su-correo@dominio.com",
        "ALEGRA_TOKEN": "su_token_de_api"
      }
    }
  }
}
```

Consulta la documentación del cliente MCP para conocer su formato exacto de configuración. No guardes credenciales en el repositorio ni compartas el archivo de configuración.

## Herramientas

- `alegra_read`: consulta colecciones y registros. Marcada como solo lectura.
- `alegra_write`: crea o actualiza registros con `POST`, `PUT` o `PATCH`.
- `alegra_delete`: elimina un registro por ID y se anuncia como operación destructiva.
- `AlegraAPI`: herramienta de propósito general para ejecutar operaciones CRUD en recursos de Alegra.

Los recursos admitidos incluyen facturas, contactos, ítems, notas crédito, órdenes de compra, pagos, bodegas, cuentas bancarias, impuestos y otros recursos disponibles en la API de Alegra.

Para `GET` y `DELETE`, `queryParams` se convierte en parámetros URL. Para `POST`, `PUT` y `PATCH`, `queryParams` se envía como cuerpo JSON. Los logs se escriben en `stderr` y no incluyen cuerpos, parámetros, respuestas ni credenciales.

## Desarrollo

```bash
npm install
npm test
npm start
```

`npm run build` compila el servidor en `build/`. Las pruebas ejercitan la construcción de URLs, autenticación, cuerpos JSON, errores HTTP y la aceptación del protocolo moderno junto con el rechazo de clientes legacy, sin conectarse a una cuenta real de Alegra.
