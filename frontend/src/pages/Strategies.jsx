import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Strategies = () => {
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch strategies on load
    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                const response = await api.get('/strategies/');
                setStrategies(response.data);
            } catch (err) {
                console.error("Failed to fetch strategies", err);
                setError('Could not load strategies.');
            } finally {
                setLoading(false);
            }
        };

        fetchStrategies();
    }, []);

    if (loading) return <div className="p-8 text-gray-400">Loading Alpha Layer...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Strategy Command</h1>
                <button
                    onClick={() => navigate('/strategies/new')} // <--- Update this line
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                >
                    + New Strategy
                </button>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Ticker</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Legs</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {strategies.map((strat) => (
                            <tr key={strat.id} className="hover:bg-gray-750 transition-colors">
                                <td className="px-6 py-4 font-medium text-blue-400">{strat.name || "Untitled"}</td>
                                <td className="px-6 py-4 font-bold">{strat.ticker}</td>
                                <td className="px-6 py-4 uppercase text-xs tracking-wider text-gray-300">
                                    {strat.instrument_type}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                                        {strat.legs.length} Legs
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {strat.is_active ? (
                                        <span className="text-green-500 text-xs font-bold uppercase">Active</span>
                                    ) : (
                                        <span className="text-red-500 text-xs font-bold uppercase">Disabled</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-gray-400 hover:text-white text-sm">Edit</button>
                                </td>
                            </tr>
                        ))}
                        {strategies.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    No active strategies found. Launch one now.
                                </td>
                            </tr>
                        )}
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

export default Strategies;