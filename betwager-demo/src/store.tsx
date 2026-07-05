import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { State, User } from "./types";
import { buildSeed } from "./seed";
import { BizError, applyTx, uid, now } from "./engine";

const STORAGE_KEY = "betwager-demo-v1";

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 1) return parsed;
    }
  } catch {
    // stockage corrompu → on repart du seed
  }
  const seed = buildSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

interface StoreValue {
  state: State;
  me: User | null;
  /** Applique une mutation métier ; renvoie {ok:false, error} si elle échoue. */
  mutate: (fn: (s: State) => void) => ActionResult;
  register: (email: string, username: string, password: string) => ActionResult;
  login: (email: string, password: string) => ActionResult;
  logout: () => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  const commit = useCallback((next: State) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
  }, []);

  const mutate = useCallback(
    (fn: (s: State) => void): ActionResult => {
      const draft: State = structuredClone(state);
      try {
        fn(draft);
      } catch (e) {
        if (e instanceof BizError) return { ok: false, error: e.message };
        console.error(e);
        return { ok: false, error: "Une erreur est survenue" };
      }
      commit(draft);
      return { ok: true };
    },
    [state, commit]
  );

  const register = useCallback(
    (email: string, username: string, password: string): ActionResult =>
      mutate((s) => {
        const mail = email.trim().toLowerCase();
        const name = username.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail))
          throw new BizError("Adresse email invalide");
        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(name))
          throw new BizError(
            "Le pseudo doit faire 3 à 20 caractères (lettres, chiffres, - et _)"
          );
        if (password.length < 8)
          throw new BizError("Le mot de passe doit faire au moins 8 caractères");
        if (s.users.some((u) => u.email === mail))
          throw new BizError("Un compte existe déjà avec cet email");
        if (s.users.some((u) => u.username.toLowerCase() === name.toLowerCase()))
          throw new BizError("Ce pseudo est déjà pris");
        const colors = ["#00E67F", "#8B5CF6", "#F4526A", "#38BDF8", "#FB923C", "#F5B93D"];
        const user: User = {
          id: uid(),
          email: mail,
          username: name,
          password,
          role: "USER",
          avatarColor: colors[Math.floor(Math.random() * colors.length)],
          bio: "",
          country: "FR",
          gamertagPsn: "",
          gamertagXbox: "",
          gamertagActivision: "",
          gamertagEpic: "",
          balanceCents: 0,
          elite: false,
          xp: 0,
          wins: 0,
          losses: 0,
          createdAt: now(),
        };
        s.users.push(user);
        applyTx(s, user.id, "BONUS", 500, "Bonus de bienvenue");
        s.sessionUserId = user.id;
      }),
    [mutate]
  );

  const login = useCallback(
    (email: string, password: string): ActionResult =>
      mutate((s) => {
        const user = s.users.find(
          (u) => u.email === email.trim().toLowerCase() && u.password === password
        );
        if (!user) throw new BizError("Identifiants invalides");
        s.sessionUserId = user.id;
      }),
    [mutate]
  );

  const logout = useCallback(() => {
    mutate((s) => {
      s.sessionUserId = null;
    });
  }, [mutate]);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    commit(buildSeed());
  }, [commit]);

  const me = useMemo(
    () => state.users.find((u) => u.id === state.sessionUserId) ?? null,
    [state]
  );

  const value = useMemo(
    () => ({ state, me, mutate, register, login, logout, resetDemo }),
    [state, me, mutate, register, login, logout, resetDemo]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé sous StoreProvider");
  return ctx;
}
