import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CreateStrategy = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        ticker: '',
        instrument_type: 'option', // Default per TRD [94]
        legs: []
    });

    // TRD [96]: Up to 4 legs allowed
    const addLeg = () => {
        if (formData.legs.length >= 4) return;
        setFormData({
            ...formData,
            legs: [
                ...formData.legs,
                {
                    leg_index: formData.legs.length + 1,
                    action: 'buy',
                    option_type: 'call',
                    quantity: 1,
                    strike_value: 0,
                    strike_mode: 'fixed',
                    expiration_days: 30
                }
            ]
        });
    };

    const removeLeg = (index) => {
        const newLegs = formData.legs.filter((_, i) => i !== index);
        // Re-index legs to ensure 1, 2, 3... sequence
        const reIndexed = newLegs.map((leg, i) => ({ ...leg, leg_index: i + 1 }));
        setFormData({ ...formData, legs: reIndexed });
    };

    const updateLeg = (index, field, value) => {
        const newLegs = [...formData.legs];
        newLegs[index][field] = value;
        setFormData({ ...formData, legs: newLegs });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/strategies/', formData);
            navigate('/strategies'); // Go back to list on success
        } catch (error) {
            console.error("Creation failed", error.response?.data);
            alert("Failed to create strategy: " + (error.response?.data?.detail?.[0]?.msg || "Unknown error"));
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Model New Strategy</h1>
            
            <form onSubmit={handleSubmit} className="max-w-4xl bg-gray-800 p-6 rounded-lg border border-gray-700">
                {/* General Info */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Strategy Name</label>
                        <input 
                            className="w-full bg-gray-700 text-white p-2 rounded" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Iron Condor"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Ticker [cite: 95]</label>
                        <input 
                            className="w-full bg-gray-700 text-white p-2 rounded uppercase" 
                            value={formData.ticker}
                            onChange={e => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
                            placeholder="SPY"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Instrument</label>
                        <select 
                            className="w-full bg-gray-700 text-white p-2 rounded"
                            value={formData.instrument_type}
                            onChange={e => setFormData({...formData, instrument_type: e.target.value})}
                        >
                            <option value="option">Option</option>
                            <option value="equity">Equity</option>
                            <option value="future">Future</option>
                        </select>
                    </div>
                </div>

                {/* Legs Section */}
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <h2 className="text-xl font-bold">Strategy Legs</h2>
                        <button 
                            type="button"
                            onClick={addLeg}
                            disabled={formData.legs.length >= 4}
                            className="text-blue-400 text-sm hover:text-blue-300 disabled:text-gray-600"
                        >
                            + Add Leg ({formData.legs.length}/4)
                        </button>
                    </div>

                    {formData.legs.map((leg, index) => (
                        <div key={index} className="grid grid-cols-6 gap-4 items-end bg-gray-700/50 p-4 rounded">
                            <div>
                                <label className="text-xs text-gray-400">Action</label>
                                <select 
                                    className={`w-full p-2 rounded font-bold ${leg.action === 'buy' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}
                                    value={leg.action}
                                    onChange={e => updateLeg(index, 'action', e.target.value)}
                                >
                                    <option value="buy">Buy</option>
                                    <option value="sell">Sell</option>
                                </select>
                            </div>
                            
                            {formData.instrument_type === 'option' && (
                                <div>
                                    <label className="text-xs text-gray-400">Type</label>
                                    <select 
                                        className="w-full bg-gray-600 p-2 rounded"
                                        value={leg.option_type}
                                        onChange={e => updateLeg(index, 'option_type', e.target.value)}
                                    >
                                        <option value="call">Call</option>
                                        <option value="put">Put</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-gray-400">Strike</label>
                                <input 
                                    type="number"
                                    className="w-full bg-gray-600 p-2 rounded"
                                    value={leg.strike_value}
                                    onChange={e => updateLeg(index, 'strike_value', parseFloat(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400">Expiration (DTE)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-gray-600 p-2 rounded"
                                    value={leg.expiration_days}
                                    onChange={e => updateLeg(index, 'expiration_days', parseInt(e.target.value))}
                                />
                            </div>

                            <button 
                                type="button" 
                                onClick={() => removeLeg(index)}
                                className="text-red-500 hover:text-red-300 text-sm pb-2"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    
                    {formData.legs.length === 0 && (
                        <div className="text-center text-gray-500 py-4 italic">
                            No legs defined. Click "+ Add Leg" to start modeling.
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4">
                    <button 
                        type="button" 
                        onClick={() => navigate('/strategies')}
                        className="text-gray-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold"
                    >
                        Save Strategy
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateStrategy;