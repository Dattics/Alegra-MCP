function formatMessage(level, message, data) {
    const details = data === undefined ? '' : ` ${JSON.stringify(data)}`;
    return `[${new Date().toISOString()}] [${level}] ${message}${details}`;
}
export const logger = {
    info(message, data) {
        console.error(formatMessage('INFO', message, data));
    },
    error(message, data) {
        console.error(formatMessage('ERROR', message, data));
    },
};
