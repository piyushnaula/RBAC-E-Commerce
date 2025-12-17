import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

interface UserProfile {
    id: string;
    email: string;
    createdAt: string;
    roles: string[];
    permissions: string[];
}

export default function Profile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetchProfile();
    }, [navigate]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            setProfile(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load profile');
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }

    if (!profile) return <div>No profile data</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

            <div className="card p-8">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
                        {profile.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{profile.email}</h2>
                        <p className="text-gray-500 text-sm">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
                        <p className="text-gray-400 text-xs mt-1 font-mono">{profile.id}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Assigned Roles</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.roles.length > 0 ? (
                                profile.roles.map((role, index) => (
                                    <span key={index} className="badge badge-purple px-3 py-1">
                                        {role}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No roles assigned</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Permissions</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.permissions.length > 0 ? (
                                profile.permissions.map((perm, index) => (
                                    <span key={index} className="badge badge-gray px-3 py-1 border border-gray-200">
                                        {perm}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No permissions</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
