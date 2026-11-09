export function getAlegraAuthHeaders(): Headers {
    const user = process.env.ALEGRA_USER;
    const token = process.env.ALEGRA_TOKEN;

    if (!user?.trim() || !token?.trim()) {
        throw new Error('ALEGRA_USER y ALEGRA_TOKEN deben estar definidos como variables de entorno');
    }

    const credentials = Buffer.from(`${user}:${token}`).toString('base64');

    return new Headers({
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    });
}
