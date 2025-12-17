import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

interface User {
    id: string;
    email: string;
    roles: string[];
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
}

export default function AdminPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/rbac/roles'),
            ]);
            setUsers(usersRes.data.data);
            setRoles(rolesRes.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Access denied or failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const assignRole = async (userId: string) => {
        if (!selectedRole) return;
        setAssigning(userId);
        try {
            await api.post('/rbac/assign-role', { userId, roleName: selectedRole });
            setSelectedRole('');
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to assign role');
        } finally {
            setAssigning(null);
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
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Admin Panel</h1>
                <div className="flex gap-4">
                    <Link to="/admin/refunds" className="btn btn-secondary btn-sm">
                        Manage Refunds
                    </Link>
                    <Link to="/admin/audit" className="btn btn-secondary btn-sm">
                        Audit Logs
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
                </div>
                <div className="card p-6">
                    <p className="text-sm text-gray-500">Available Roles</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{roles.length}</p>
                </div>
                <div className="card p-6">
                    <p className="text-sm text-gray-500">Roles</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {roles.map((r) => (
                            <span key={r.id} className="badge badge-blue">{r.name}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-medium text-gray-900">{user.email}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.length > 0 ? (
                                                user.roles.map((role) => (
                                                    <span key={role} className="badge badge-purple">{role}</span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-sm">No roles</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={assigning === user.id ? selectedRole : ''}
                                                onChange={(e) => {
                                                    setSelectedRole(e.target.value);
                                                    setAssigning(user.id);
                                                }}
                                                className="input text-sm py-1 w-32"
                                            >
                                                <option value="">Add role...</option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.name}>{role.name}</option>
                                                ))}
                                            </select>
                                            {assigning === user.id && selectedRole && (
                                                <button
                                                    onClick={() => assignRole(user.id)}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    Assign
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
