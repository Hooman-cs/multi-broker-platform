import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { logout, user } = useAuth(); // Ensure 'user' is destructured

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-2xl font-bold mb-4">Command Center</h1>
            <p className="mb-8 text-gray-600">Welcome, {user?.first_name || 'User'}.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* 1. Strategy Card - Visible to All */}
                <Link to="/strategies" className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                    <h2 className="text-xl font-bold text-blue-600 mb-2">Strategy Management &rarr;</h2>
                    <p className="text-gray-500">Design, simulate, and deploy multi-leg structures.</p>
                </Link>
                
                {/* 2. User Admin Card - HIDDEN for Analysts  */}
                {['super_admin', 'admin'].includes(user?.role) && (
                    <Link to="/users" className="bg-white p-6 rounded shadow hover:shadow-lg transition border-l-4 border-purple-600">
                        <h2 className="text-xl font-bold text-purple-900 mb-2">User Administration &rarr;</h2>
                        <p className="text-gray-500">Manage analysts, roles, and access permissions.</p>
                    </Link>
                )}
            </div>

            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Logout Session
            </button>
        </div>
    );
};

export default Dashboard;