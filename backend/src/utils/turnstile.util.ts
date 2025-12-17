import axios from 'axios';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(token: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
        console.warn('TURNSTILE_SECRET_KEY is not set. Skipping verification.');
        return true; // fail open if config is missing in dev, or false to fail closed
    }

    try {
        const response = await axios.post(TURNSTILE_VERIFY_URL, {
            secret: secretKey,
            response: token,
        });

        const data = response.data;
        return data.success === true;
    } catch (error) {
        console.error('Turnstile verification error:', error);
        return false;
    }
}
