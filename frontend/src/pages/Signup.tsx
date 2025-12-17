import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import api from '../api/api';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!captchaToken) {
            setError('Please complete the security challenge');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/signup', { email, password, captchaToken });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Signup failed');
            setCaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="card w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
                    <p className="text-gray-500 mt-2">Get started with RBAC Shop</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex justify-center">
                        <Turnstile
                            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                            onSuccess={(token) => setCaptchaToken(token)}
                            options={{
                                theme: 'light',
                                size: 'normal',
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-3"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
