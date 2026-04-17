import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Empresas } from './pages/Empresas';
import { EmpresaDetalle } from './pages/EmpresaDetalle';
import { Trabajadores } from './pages/Trabajadores';
import { TrabajadorDetalle } from './pages/TrabajadorDetalle';
 
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0, // Siempre refrescar — así los faltantes se actualizan al navegar
    },
  },
});
 
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/empresas" element={<Empresas />} />
                      <Route path="/empresa/:id" element={<EmpresaDetalle />} />
                      <Route path="/trabajadores" element={<Trabajadores />} />
                      <Route path="/trabajador/:id" element={<TrabajadorDetalle />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
 
export default App;
