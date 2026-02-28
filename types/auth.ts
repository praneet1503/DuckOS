export type User = {
  id: string;
  username: string;
  passwordHash: string;
  avatar?: string;
  createdAt: number;
};

export type Session = {
  userId: string;
};

export interface AuthState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  selectedUserId: string | null;
}

export interface AuthActions {
  loadUsers: () => void;
  register: (username: string, password: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  loginSelectedUser: (password: string) => Promise<boolean>;
  selectUser: (userId: string) => void;
  clearError: () => void;
  logout: () => void;
  lock: () => void;
  autoLogin: () => void;
}
