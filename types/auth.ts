export type User = {
  id: string;
  username: string;
  avatar?: string;
};

export interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  lock: () => void;
  autoLogin: () => void;
  clearError: () => void;
}
