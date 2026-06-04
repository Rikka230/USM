import { useEffect, useState, type ComponentType } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Button, Input, Field, Card, Spinner } from "@/components/ui/kit";
import PlayersModule from "./modules/PlayersModule";
import { Users, Briefcase, Newspaper, Settings, Images, LogOut, Menu, X, Rocket } from "lucide-react";

function Stub(label: string): ComponentType {
  return function StubModule() {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">{label}</h1>
        <Card><p className="text-muted-foreground">Module « {label} » — reconstruction en cours (prochain lot du chantier).</p></Card>
      </div>
    );
  };
}

const MODULES: { key: string; label: string; icon: any; comp: ComponentType }[] = [
  { key: "players", label: "Joueurs", icon: Users, comp: PlayersModule },
  { key: "services", label: "Services", icon: Briefcase, comp: Stub("Services") },
  { key: "presse", label: "Presse", icon: Newspaper, comp: Stub("Presse") },
  { key: "settings", label: "Réglages", icon: Settings, comp: Stub("Réglages") },
  { key: "marquee", label: "Galerie", icon: Images, comp: Stub("Galerie (Marquee)") },
];

const ERR: Record<string, string> = {
  "auth/invalid-credential": "Email ou mot de passe incorrect.",
  "auth/wrong-password": "Email ou mot de passe incorrect.",
  "auth/user-not-found": "Email ou mot de passe incorrect.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
};

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pwd);
    } catch (ex: any) {
      setErr(ERR[ex?.code] || "Connexion impossible.");
    } finally { setLoading(false); }
  }
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-center font-display text-2xl font-black uppercase">USM <span className="text-primary">Admin</span></h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">Espace d'administration</p>
        <form onSubmit={submit}>
          <Field label="Email"><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Mot de passe"><Input type="password" autoComplete="current-password" value={pwd} onChange={(e) => setPwd(e.target.value)} required /></Field>
          {err && <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm">{err}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? <Spinner /> : "Se connecter"}</Button>
        </form>
      </Card>
    </div>
  );
}

function Dashboard({ user }: { user: User }) {
  const toast = useToast();
  const [active, setActive] = useState("players");
  const [navOpen, setNavOpen] = useState(false);
  const ActiveComp = MODULES.find((m) => m.key === active)!.comp;

  const NavList = (
    <nav className="flex flex-col gap-1">
      {MODULES.map((m) => {
        const Icon = m.icon;
        return (
          <button key={m.key}
            onClick={() => { setActive(m.key); setNavOpen(false); }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${active === m.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
            <Icon size={18} /> {m.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setNavOpen(true)} aria-label="Menu"><Menu /></button>
        <span className="font-display font-black uppercase">USM <span className="text-primary">Admin</span></span>
        <Button size="sm" variant="ghost" onClick={() => signOut(auth)} aria-label="Déconnexion"><LogOut size={18} /></Button>
      </header>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card p-4 lg:flex">
          <div className="mb-6 font-display text-xl font-black uppercase">USM <span className="text-primary">Admin</span></div>
          {NavList}
          <div className="mt-auto flex flex-col gap-2 pt-4">
            <Button variant="outline" onClick={() => toast("Publication : à venir (Jalon 6)", "info")}><Rocket size={16} /> Publier</Button>
            <Button variant="ghost" onClick={() => signOut(auth)}><LogOut size={16} /> Déconnexion</Button>
            <p className="truncate px-1 text-xs text-muted-foreground">{user.email}</p>
          </div>
        </aside>

        {/* Drawer mobile */}
        {navOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setNavOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-64 bg-card p-4">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display font-black uppercase">Menu</span>
                <button onClick={() => setNavOpen(false)} aria-label="Fermer"><X /></button>
              </div>
              {NavList}
              <div className="mt-6"><Button variant="outline" className="w-full" onClick={() => toast("Publication : à venir (Jalon 6)", "info")}><Rocket size={16} /> Publier</Button></div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><ActiveComp /></main>
      </div>
    </div>
  );
}

function Shell() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);
  if (user === undefined) return <div className="flex min-h-dvh items-center justify-center"><Spinner className="h-8 w-8 text-primary" /></div>;
  return user ? <Dashboard user={user} /> : <LoginScreen />;
}

export default function AdminApp() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
