function formatMessage(level: string, message: string, data?: unknown): string {
    const details = data === undefined ? '' : ` ${JSON.stringify(data)}`;
    return `[${new Date().toISOString()}] [${level}] ${message}${details}`;
}

export const logger = {
    info(message: string, data?: unknown) {
        console.error(formatMessage('INFO', message, data));
    },
    error(message: string, data?: unknown) {
        console.error(formatMessage('ERROR', message, data));
    },
};
