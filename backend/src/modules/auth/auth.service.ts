import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../../utils/hash.util';
import { signToken } from '../../utils/jwt.util';
import { verifyTurnstileToken } from '../../utils/turnstile.util';

const prisma = new PrismaClient();

interface SignupInput {
    email: string;
    password: string;
    captchaToken?: string;
}

interface LoginInput {
    email: string;
    password: string;
    captchaToken?: string;
}

export async function signup(input: SignupInput) {
    const { email, password, captchaToken } = input;

    // Verify Turnstile
    if (captchaToken) {
        const isValid = await verifyTurnstileToken(captchaToken);
        if (!isValid) {
            throw new Error('Security check failed');
        }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('User already exists with this email');
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
        },
    });

    // Generate token
    const token = signToken({ userId: user.id, email: user.email });

    return {
        user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        },
        token,
    };
}

export async function login(input: LoginInput) {
    const { email, password, captchaToken } = input;

    // Verify Turnstile
    if (captchaToken) {
        const isValid = await verifyTurnstileToken(captchaToken);
        if (!isValid) {
            throw new Error('Security check failed');
        }
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Check password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
        throw new Error('Invalid email or password');
    }

    // Generate token
    const token = signToken({ userId: user.id, email: user.email });

    return {
        user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        },
        token,
    };
}
