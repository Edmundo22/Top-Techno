import { Navigate, Route, Routes } from 'react-router-dom';
import { HistoricoPage } from '../pages/Historico';
import { LoginPage } from '../pages/Login';
import { MonitoramentoPage } from '../pages/Monitoramento';
import { ProtectedRoute } from '../components/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/monitoramento"
        element={
          <ProtectedRoute>
            <MonitoramentoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historico"
        element={
          <ProtectedRoute>
            <HistoricoPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/monitoramento" replace />} />
      <Route path="*" element={<Navigate to="/monitoramento" replace />} />
    </Routes>
  );
}
