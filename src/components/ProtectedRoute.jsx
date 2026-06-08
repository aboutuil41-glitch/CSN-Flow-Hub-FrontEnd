import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
    const { token, user, loading } = useAuth();


    if (loading) return null;


    if (!token) {
        return <Navigate to="/" replace />;
    }


    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/Dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;