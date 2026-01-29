import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const { user } = useAuth(); 

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users/');
                setUsers(response.data);
            } catch (err) {
                console.error("Failed to fetch users", err);
                setError('Access Denied or Failed to load users.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await api.delete(`/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            alert("Failed to delete: " + (err.response?.data?.detail || "Unknown error"));
        }
    };

    if (loading) return <div className="p-8 text-gray-400">Loading Users...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">User Management</h1>
                
                {user?.role === 'super_admin' && (
                    <button 
                        onClick={() => navigate('/users/new')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                    >
                        + Add New User
                    </button>
                )}
            </div>

            {error && <div className="bg-red-900/50 p-4 rounded text-red-200 mb-4">{error}</div>}

            <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Telegram</th> {/* ADDED */}
                            <th className="px-6 py-3">Multiplier</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-750 transition-colors">
                                <td className="px-6 py-4 font-medium">{u.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs uppercase font-bold px-2 py-1 rounded ${
                                        u.role === 'super_admin' ? 'bg-purple-900 text-purple-200' :
                                        u.role === 'admin' ? 'bg-blue-900 text-blue-200' :
                                        u.role === 'account_manager' ? 'bg-orange-900 text-orange-200' :
                                        'bg-gray-700 text-gray-300'
                                    }`}>
                                        {u.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{u.first_name} {u.last_name}</td>
                                <td className="px-6 py-4 text-blue-300 font-mono text-xs">{u.telegram_id || '-'}</td> {/* ADDED */}
                                <td className="px-6 py-4 text-yellow-400 font-mono">x{u.multiplier}</td>
                                <td className="px-6 py-4">
                                    {u.is_active ? (
                                        <span className="text-green-500 text-xs font-bold">Active</span>
                                    ) : (
                                        <span className="text-red-500 text-xs font-bold">Disabled</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 flex gap-4">
                                    {['super_admin', 'admin'].includes(user?.role) && (
                                        <button 
                                            onClick={() => navigate(`/users/edit/${u.id}`)}
                                            className="text-blue-400 hover:text-blue-200 text-sm"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {user?.role === 'super_admin' && (
                                        <button 
                                            onClick={() => handleDelete(u.id)}
                                            className="text-red-400 hover:text-red-200 text-sm"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8">
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-400 hover:text-white text-sm underline"
                >
                    &larr; Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default Users;