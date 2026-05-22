"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 bg-surface p-8 shadow-ambient border border-surface-container-highest">
      <h2 className="font-headline-md text-headline-md text-center mb-8">Connexion</h2>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-b border-outline-variant py-2 focus:outline-none focus:border-primary transition-colors font-body-md text-body-md"
            required
          />
        </div>

        <div>
          <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-b border-outline-variant py-2 focus:outline-none focus:border-primary transition-colors font-body-md text-body-md"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 border border-on-surface text-on-surface font-label-caps text-label-caps px-4 py-4 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
