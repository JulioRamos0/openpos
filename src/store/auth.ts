import { create } from "zustand";

type User = {
  id: number;
  username: string;
  pin: string;
  name: string;
  role: "admin" | "cashier";
  active: number;
};

type AuthStore = {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, pin: string) => boolean;
  logout: () => void;
};

export const useAuth = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,

  login(username, pin) {
    // Users hardcodeados (también podrían venir de DB)
    const users: User[] = [
      { id: 1, username: "admin", pin: "1234", name: "Administrador", role: "admin", active: 1 },
      { id: 2, username: "caja", pin: "5678", name: "Caja 1", role: "cashier", active: 1 },
    ];

    const validUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin && u.active === 1
    );

    if (validUser) {
      set({ isAuthenticated: true, user: validUser });
      return true;
    }

    return false;
  },

  logout() {
    set({ isAuthenticated: false, user: null });
  },
}));