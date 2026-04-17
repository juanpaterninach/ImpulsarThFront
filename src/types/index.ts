export interface Empresa {
  id: number;
  nombre: string;
  estado: string;
  fecha_creacion: string;
}

export interface Trabajador {
  id: number;
  empresa_id: number;
  nombre: string;
  cedula: string;
  estado: string;
  fecha_creacion: string;
}

export interface Documento {
  id: number;
  trabajador_id: number;
  tipo_documento_id: number;
  url_archivo: string;
  fecha_carga: string;
}

export interface TipoDocumento {
  id: number;
  nombre: string;
}

export interface DocumentoFaltante {
  tipo_documento_id: number;
  nombre: string;
}

export interface FaltantesResponse {
  trabajador_id: number;
  faltantes: DocumentoFaltante[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  email: string;
  rol: string;
}
