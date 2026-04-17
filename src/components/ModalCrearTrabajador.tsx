import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createTrabajador, getEmpresas } from '../api';
import type { Empresa } from '../types';

interface Props {
  onClose: () => void;
  defaultEmpresaId?: number;
}

export const ModalCrearTrabajador = ({ onClose, defaultEmpresaId }: Props) => {
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [empresaId, setEmpresaId] = useState<number | ''>(defaultEmpresaId ?? '');
  const [estado, setEstado] = useState('activo');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => getEmpresas().then((r) => r.data as Empresa[]),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createTrabajador({
        nombre,
        cedula,
        empresa_id: Number(empresaId),
        estado,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail || 'Error al crear el trabajador');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    if (!cedula.trim()) { setError('La cédula es requerida'); return; }
    if (!empresaId) { setError('Selecciona una empresa'); return; }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <h2 className="font-bold text-slate-800">Nuevo trabajador</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={15} className="flex-shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Carlos Pérez"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Número de cédula <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej: 1234567890"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Empresa <span className="text-red-500">*</span>
            </label>
            <select
              value={empresaId}
              onChange={(e) => setEmpresaId(Number(e.target.value))}
              className="input"
            >
              <option value="">Seleccionar empresa...</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Estado</label>
            <div className="flex gap-3">
              {['activo', 'inactivo'].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setEstado(op)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    estado === op
                      ? op === 'activo'
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-amber-400 text-white border-amber-400'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {op.charAt(0).toUpperCase() + op.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 btn-primary justify-center"
            >
              {mutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creando...</>
              ) : (
                <><CheckCircle2 size={16} />Crear trabajador</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
