import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EditUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: loggedInUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'analyst',
        multiplier: 1.0,
        telegram_id: '',
        is_active: true
    });

    // Generate multiplier options: 1.0, 1.5, 2.0 ... 10.0 [TRD 78]
    const multiplierOptions = [];
    for (let i = 10; i <= 100; i += 5) {
        multiplierOptions.push((i / 10).toFixed(1));
    }

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Fetch all users and find target
                const response = await api.get('/users/');
                const targetUser = response.data.find(u => u.id === id);

                if (targetUser) {
                    setFormData({
                        first_name: targetUser.first_name || '',
                        last_name: targetUser.last_name || '',
                        email: targetUser.email,
                        role: targetUser.role,
                        multiplier: targetUser.multiplier,
                        telegram_id: targetUser.telegram_id || '',
                        is_active: targetUser.is_active
                    });
                } else {
                    setError("User not found");
                }
            } catch (err) {
                setError("Failed to load user data");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, password: "dummy_password" };
            await api.put(`/users/${id}`, payload);
            navigate('/users');
        } catch (err) {
            alert("Update failed: " + (err.response?.data?.detail || "Unknown error"));
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">Edit User Profile</h1>

                <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg border border-gray-700 space-y-6">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">First Name</label>
                            <input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full bg-gray-700 p-3 rounded text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Last Name</label>
                            <input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full bg-gray-700 p-3 rounded text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Email (Read Only)</label>
                        <input
                            value={formData.email}
                            disabled
                            className="w-full bg-gray-700/50 text-gray-400 p-3 rounded cursor-not-allowed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                disabled={loggedInUser?.role !== 'super_admin'}
                                className={`w-full p-3 rounded text-white border border-transparent 
                                    ${loggedInUser?.role !== 'super_admin' ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed' : 'bg-gray-700 focus:border-blue-500'}`}
                            >
                                <option value="analyst">Analyst</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="account_manager">Account Manager</option>
                            </select>
                            {loggedInUser?.role !== 'super_admin' && (
                                <p className="text-xs text-gray-500 mt-1">Only Super Admin can change roles.</p>
                            )}
                        </div>

                        {/* CORRECTED MULTIPLIER DROPDOWN [TRD 78] */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Risk Multiplier</label>
                            <select
                                name="multiplier"
                                value={formData.multiplier}
                                onChange={handleChange}
                                className="w-full bg-gray-700 p-3 rounded text-white focus:border-blue-500"
                            >
                                {multiplierOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}x</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Increments of 0.5 [TRD 78]</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Telegram ID</label>
                        <input
                            name="telegram_id"
                            value={formData.telegram_id}
                            onChange={handleChange}
                            className="w-full bg-gray-700 p-3 rounded text-white"
                            placeholder="@username"
                        />
                    </div>

                    {/* Active Status Toggle */}
                    <div className="flex items-center gap-3 bg-gray-700/30 p-4 rounded">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="w-5 h-5"
                        />
                        <label className="text-white">User Account Active</label>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/users')}
                            className="text-gray-400 hover:text-white px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-bold"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUser;