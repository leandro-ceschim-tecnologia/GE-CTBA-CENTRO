import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./router/AppRouter";
import "./styles/app.css";

export default function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}