
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./LoginPage.css";

function getDashboardPath(role: string): string {
  const paths: Record<string, string> = {
    SUPER_ADMIN: "/super-admin/dashboard",
    APARTMENT_ADMIN: "/apartment-admin/dashboard",
    SUPPLIER: "/supplier/dashboard",
    RESIDENT: "/resident/dashboard",
  };

  return paths[role] ?? "/login";
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const user = await login(email.trim(), password);

      navigate(getDashboardPath(user.role), { replace: true });
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-content">
          <div className="brand-logo">GB</div>
          <h1>gather buy</h1>
          <p className="brand-tagline">Better together. Save together.</p>

          <div className="brand-message">
            <h2>Good things happen when communities come together.</h2>
            <p>
              Discover a simpler way to shop together, place bulk orders,
              and enjoy community savings.
            </p>
          </div>
        </div>

        <p className="brand-footer">Community shopping, made easier.</p>
      </section>

      <section className="login-form-section">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-logo">GB</div>
            <span>gather buy</span>
          </div>

          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your account</h2>
          <p className="login-description">
            Enter your credentials to continue.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="login-footer">
            Secure access to your Gather Buy account.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
