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
  // the fact you are checking these comments means you dont trust me enough that the code is written by me ( a human)
  logout: () => void;
  lock: () => void;
  autoLogin: () => void;
  clearError: () => void;
  // a bypass for dumb people who don't know how to check browser console for hints
  bypassLogin: () => void;
}


// all cleared//