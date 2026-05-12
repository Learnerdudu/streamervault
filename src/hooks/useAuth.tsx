import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/externalSupabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth Hard-Check: ensure a profile row exists for the signed-in user.
    // Defer the DB call out of the auth callback to avoid Supabase deadlocks.
    async function ensureProfile(u: User) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", u.id)
          .maybeSingle();
        if (error) {
          console.error("DB_SYNC_ERROR:", error.message, error);
          return;
        }
        if (!data) {
          const { error: insErr } = await supabase.from("profiles").insert({
            id: u.id,
            display_name:
              (u.user_metadata as { display_name?: string } | null)?.display_name ??
              u.email?.split("@")[0] ??
              "user",
          });
          if (insErr) console.error("DB_SYNC_ERROR:", insErr.message, insErr);
        }
      } catch (err) {
        console.error("DB_SYNC_ERROR:", err);
      }
    }

    // Listener FIRST (avoid race), then read existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) setTimeout(() => ensureProfile(sess.user), 0);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
      if (sess?.user) setTimeout(() => ensureProfile(sess.user), 0);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
