import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import api from '../api/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!captchaToken) {
            setError('Please complete the security challenge');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password, captchaToken });
            localStorage.setItem('token', res.data.data.token);
            navigate('/');
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
            setCaptchaToken(null);
            // Turnstile auto-resets on some errors, but we can't easily force reset like ref.current.reset() without a ref
            // Ideally we would use a ref for Turnstile to reset it, but for now we just clear the token.
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="card w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                    <p className="text-gray-500 mt-2">Sign in to your account</p>
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
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : null}
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-6">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
