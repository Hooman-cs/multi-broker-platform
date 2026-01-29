import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CreateUser = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'analyst', // Default role
        multiplier: 1.0,
        telegram_id: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('/users/', formData);
            navigate('/users'); // Go back to list on success
        } catch (err) {
            console.error("Creation failed", err.response?.data);
            setError(err.response?.data?.detail || "Failed to create user");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">Onboard New Member</h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg border border-gray-700 space-y-6">

                    {/* Name Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">First Name</label>
                            <input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full bg-gray-700 p-3 rounded text-white focus:outline-none focus:border-blue-500 border border-transparent"
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Last Name</label>
                            <input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full bg-gray-700 p-3 rounded text-white focus:outline-none focus:border-blue-500 border border-transparent"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    {/* Credentials Section */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-gray-700 p-3 rounded text-white border border-transparent focus:border-blue-500"
                            placeholder="analyst@parikh.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Temporary Password</label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-gray-700 p-3 rounded text-white border border-transparent focus:border-blue-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* Roles & Settings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">System Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full bg-gray-700 p-3 rounded text-white border border-transparent focus:border-blue-500"
                            >
                                <option value="analyst">Analyst (Standard)</option>
                                <option value="admin">Admin (Manager)</option>
                                <option value="super_admin">Super Admin (Owner)</option>
                                <option value="account_manager">Account Manager</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Risk Multiplier</label>
                            {/*<input 
                                name="multiplier"
                                type="number"
                                step="0.1"
                                value={formData.multiplier}
                                onChange={handleChange}
                                className="w-full bg-gray-700 p-3 rounded text-white border border-transparent focus:border-blue-500"
                            />*/}
                            <input
                                name="multiplier"
                                type="number"
                                min="1"        // Minimum 1x
                                max="10"       // Maximum 10x
                                step="1"       // Integers only (No decimals)
                                value={formData.multiplier}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    // Prevent typing decimals (.) or negative signs (-)
                                    if (e.key === '.' || e.key === '-' || e.key === 'e') {
                                        e.preventDefault();
                                    }
                                }}
                                className="w-full bg-gray-700 p-3 rounded text-white border border-transparent focus:border-blue-500"
                            />
                            <p className="text-gray-500 text-xs mt-1">Allowed range: 1 - 10 (Whole numbers only)</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Telegram ID (Optional)</label>
                        <input
                            name="telegram_id"
                            value={formData.telegram_id}
                            onChange={handleChange}
                            className="w-full bg-gray-700 p-3 rounded text-white border border-transparent focus:border-blue-500"
                            placeholder="@username"
                        />
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
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold shadow-lg transition-all"
                        >
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUser;