import axios from 'axios';
 
const API_BASE = 'https://impulsarthapi.onrender.com';
 
export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});
 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
 
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
 
// ─── Auth ───────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });
 
// ─── Empresas ───────────────────────────────────────────────────────────
export const getEmpresas = () => api.get('/empresas/');
export const createEmpresa = (data: { nombre: string; estado: string }) =>
  api.post('/empresas/', data);
 
// ─── Trabajadores ───────────────────────────────────────────────────────
export const getTrabajadores = () => api.get('/trabajadores/');
export const createTrabajador = (data: {
  nombre: string;
  cedula: string;
  empresa_id: number;
  estado: string;
}) => api.post('/trabajadores/', data);
 
// estado va como query param según /docs
export const updateEstado = (id: number, estado: string) =>
  api.put(`/trabajadores/${id}/estado?estado=${encodeURIComponent(estado)}`);
 
export const getFaltantes = (id: number) =>
  api.get(`/trabajadores/${id}/faltantes`);
 
export const getDocumentosTrabajador = (trabajadorId: number) =>
  api.get(`/trabajadores/${trabajadorId}/documentos`);
 
// ─── Documentos ─────────────────────────────────────────────────────────
// Campo = "archivo" (no "file"), trabajador_id y tipo_documento_id = query params
// Usamos fetch nativo para que el browser genere el boundary correcto en multipart
export const uploadDocumento = (
  file: File,
  trabajadorId: number,
  tipoDocumentoId: number
) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('archivo', file);
  return fetch(
    `${API_BASE}/documentos/upload?trabajador_id=${trabajadorId}&tipo_documento_id=${tipoDocumentoId}`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }
  ).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { response: { status: res.status, data } };
    return { data };
  });
};

export const updateTrabajador = (id: number, data: {
  nombre: string;
  cedula: string;
  estado: string;
  empresa_id: number;
  fecha_creacion: string;
}) => api.patch(`/trabajadores/${id}/actualizar`, data);
