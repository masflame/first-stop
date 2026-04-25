import { useEffect, useMemo, useState } from "react";
import Seo from "../components/Seo";
import { authSupabase } from "../utils/authSupabase";
import "./AccountPage.css";

const USERS_TABLE = "ShoeDistrict_Users";

const emptyProfile = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  gender: "",
  purchase_count: 0,
};

export default function AccountPage() {
  const [mode, setMode] = useState("signin");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
  });

  const [profile, setProfile] = useState(emptyProfile);

  const userEmail = useMemo(() => session?.user?.email || "", [session]);

  useEffect(() => {
    if (!authSupabase) {
      setError("Auth is not configured. Check Supabase environment variables.");
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    authSupabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = authSupabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.email || !authSupabase) {
      setProfile(emptyProfile);
      return;
    }

    setError("");
    setMessage("");

    loadOrCreateUserProfile(session.user.email);
  }, [session?.user?.email]);

  async function loadOrCreateUserProfile(email) {
    if (!authSupabase) return;

    const { data, error: fetchError } = await authSupabase
      .from(USERS_TABLE)
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      setError(`Could not load account: ${fetchError.message}`);
      return;
    }

    if (data) {
      setProfile({
        ...emptyProfile,
        ...data,
        email,
      });
      return;
    }

    const baseProfile = {
      ...emptyProfile,
      email,
      username: email.split("@")[0],
      purchase_count: 0,
    };

    const { data: inserted, error: insertError } = await authSupabase
      .from(USERS_TABLE)
      .insert([baseProfile])
      .select()
      .single();

    if (insertError) {
      setError(`Could not create profile: ${insertError.message}`);
      return;
    }

    setProfile({
      ...emptyProfile,
      ...inserted,
      email,
    });
  }

  async function onSignIn(e) {
    e.preventDefault();
    if (!authSupabase) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    const { error: signInError } = await authSupabase.auth.signInWithPassword({
      email: authForm.email.trim(),
      password: authForm.password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage("Signed in successfully.");
    }

    setSubmitting(false);
  }

  async function onSignUp(e) {
    e.preventDefault();
    if (!authSupabase) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    const { data, error: signUpError } = await authSupabase.auth.signUp({
      email: authForm.email.trim(),
      password: authForm.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (data.user?.email) {
      await loadOrCreateUserProfile(data.user.email);
    }

    setMessage("Sign up successful. Check your email if confirmation is required.");
    setSubmitting(false);
  }

  async function onGoogleSignIn() {
    if (!authSupabase) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const redirectTo = `${siteUrl}/account`;
    const { error: oauthError } = await authSupabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (oauthError) {
      setError(oauthError.message);
      setSubmitting(false);
    }
  }

  async function onSignOut() {
    if (!authSupabase) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    const { error: signOutError } = await authSupabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
    } else {
      setMessage("Signed out.");
      setAuthForm({ email: "", password: "" });
      setProfile(emptyProfile);
    }

    setSubmitting(false);
  }

  async function onSaveProfile(e) {
    e.preventDefault();
    if (!authSupabase || !userEmail) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    const payload = {
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      username: profile.username || null,
      email: userEmail,
      phone: profile.phone || null,
      gender: profile.gender || null,
      purchase_count: Number.isFinite(Number(profile.purchase_count))
        ? Number(profile.purchase_count)
        : 0,
    };

    const { error: updateError } = await authSupabase
      .from(USERS_TABLE)
      .update(payload)
      .eq("email", userEmail);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Profile saved.");
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="account-page">
        <Seo title="Account" noindex canonicalPath="/account" />
        <div className="account-shell">
          <p className="account-info">Loading account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <Seo title="Account" canonicalPath="/account" />
      <div className="account-shell">
        <h1 className="account-title">Account</h1>

        {!session ? (
          <section className="account-card">
            <div className="account-tabs">
              <button
                type="button"
                className={`account-tab ${mode === "signin" ? "active" : ""}`}
                onClick={() => setMode("signin")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`account-tab ${mode === "signup" ? "active" : ""}`}
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
            </div>

            <form className="account-form" onSubmit={mode === "signin" ? onSignIn : onSignUp}>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm((s) => ({ ...s, email: e.target.value }))}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  minLength={6}
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm((s) => ({ ...s, password: e.target.value }))}
                />
              </label>
              <button type="submit" disabled={submitting}>
                {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="account-divider">or</div>

            <button type="button" className="google-btn" onClick={onGoogleSignIn} disabled={submitting}>
              Continue with Google
            </button>
          </section>
        ) : (
          <section className="account-card">
            <p className="account-info">Signed in as {userEmail}</p>

            <form className="account-form" onSubmit={onSaveProfile}>
              <label>
                First name
                <input
                  type="text"
                  value={profile.first_name || ""}
                  onChange={(e) => setProfile((s) => ({ ...s, first_name: e.target.value }))}
                />
              </label>
              <label>
                Last name
                <input
                  type="text"
                  value={profile.last_name || ""}
                  onChange={(e) => setProfile((s) => ({ ...s, last_name: e.target.value }))}
                />
              </label>
              <label>
                Username
                <input
                  type="text"
                  value={profile.username || ""}
                  onChange={(e) => setProfile((s) => ({ ...s, username: e.target.value }))}
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile((s) => ({ ...s, phone: e.target.value }))}
                />
              </label>
              <label>
                Gender
                <input
                  type="text"
                  value={profile.gender || ""}
                  onChange={(e) => setProfile((s) => ({ ...s, gender: e.target.value }))}
                />
              </label>
              <label>
                Purchase count
                <input
                  type="number"
                  min="0"
                  value={profile.purchase_count ?? 0}
                  onChange={(e) => setProfile((s) => ({ ...s, purchase_count: e.target.value }))}
                />
              </label>
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Profile"}
              </button>
            </form>

            <button type="button" className="signout-btn" onClick={onSignOut} disabled={submitting}>
              Sign Out
            </button>
          </section>
        )}

        {message ? <p className="account-message">{message}</p> : null}
        {error ? <p className="account-error">{error}</p> : null}
      </div>
    </main>
  );
}
