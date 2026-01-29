import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import CreateStrategy from './pages/CreateStrategy';
import Users from './pages/Users';
import CreateUser from './pages/CreateUser';
import EditUser from './pages/EditUser';

// Protected Route Component: Redirects to login if not authenticated
const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    {/* ADD THIS NEW ROUTE */}
                    <Route
                        path="/strategies"
                        element={
                            <PrivateRoute>
                                <Strategies />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/strategies/new"
                        element={
                            <PrivateRoute>
                                <CreateStrategy />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/users"
                        element={
                            <PrivateRoute>
                                <Users />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/users/new"
                        element={
                            <PrivateRoute>
                                <CreateUser />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/users/edit/:id"
                        element={
                            <PrivateRoute>
                                <EditUser />
                            </PrivateRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
export default App;