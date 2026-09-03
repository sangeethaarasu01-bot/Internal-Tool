// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Conversion Types
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export type ConversionStatusType =
  | "idle"
  | "uploading"
  | "converting"
  | "success"
  | "error";

export interface ConversionResponse {
  success: boolean;
  message?: string;
  xmlContent?: string;
  error?: string;
}
