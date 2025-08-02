import { Navigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";

export default function PrivateRoute({ children }) {
  const [user, loading] = useAuthState(auth);
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" />;
}
