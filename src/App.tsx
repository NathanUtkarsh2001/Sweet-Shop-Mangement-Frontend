import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";

/*
  SweetShop Single-file React + TypeScript App (Tailwind UI)

  - Drop this file as src/App.tsx in a Vite or CRA + TypeScript project
  - Ensure Tailwind CSS is configured in your project
  - Backend base URL is read from REACT_APP_API_BASE or falls back to http://localhost:4000/api

  Expected backend routes (adjust if needed):
    POST  /auth/register       -> { name, email, password }  => { user, token }
    POST  /auth/login          -> { email, password }         => { user, token }
    GET   /sweets              -> []
    POST  /sweets              -> (admin) add sweet
    PUT   /sweets/:id          -> (admin) update sweet
    DELETE /sweets/:id         -> (admin) delete sweet
    POST  /sweets/:id/purchase -> { quantity }
*/

const API_BASE =
  (import.meta &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:4000/api";

/* ----------------------- Types ----------------------- */

type User = {
  id?: string;
  name: string;
  email: string;
  isAdmin?: boolean;
};

type AuthResponse = { user: User; token: string };

type Sweet = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category?: string;
};

/* ----------------------- API Helper ----------------------- */

async function apiFetch(path: string, init: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers, ...init });

  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";

  let data: any = text;
  if (contentType.includes("application/json") && text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
  }

  if (!res.ok) {
    // propagate a structured error
    throw { status: res.status, data };
  }

  return data;
}

/* ----------------------- Auth Context ----------------------- */

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  function login(newToken: string, newUser: User) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ----------------------- Small UI primitives ----------------------- */

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
function Input(props: InputProps) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full px-4 py-2 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-pink-300 focus:outline-none transition-shadow ${className}`}
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};
function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "px-4 py-2 rounded-2xl font-medium shadow-sm transition inline-flex items-center justify-center";
  const variants: Record<string, string> = {
    primary: "bg-pink-500 text-white hover:bg-pink-600",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button {...props} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 ${className}`}>
      {children}
    </div>
  );
}

/* ----------------------- Auth Forms ----------------------- */

function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const resp = data as AuthResponse;
      auth.login(resp.token, resp.user);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Sign in</h2>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          className="w-full"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}

function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      const resp = data as AuthResponse;
      auth.login(resp.token, resp.user);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Create account</h2>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <Input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          className="w-full"
        >
          {loading ? "Creating..." : "Sign up"}
        </Button>
      </form>
    </Card>
  );
}

/* ----------------------- Sweets UI ----------------------- */

function SweetsCard({
  sweet,
  onPurchaseClick,
  isAdmin,
  onEdit,
  onDelete,
}: {
  sweet: Sweet;
  onPurchaseClick: (s: Sweet) => void;
  isAdmin?: boolean;
  onEdit?: (s: Sweet) => void;
  onDelete?: (s: Sweet) => void;
}) {
  const id = sweet.id ?? sweet._id ?? "";
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
      <div className="h-44 bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center overflow-hidden">
        {sweet.imageUrl ? (
          <img
            src={sweet.imageUrl}
            alt={sweet.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="text-gray-400">No image</div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {sweet.name}
            </h3>
            <div className="text-xs text-gray-500 mt-1">
              {sweet.category ?? "Uncategorized"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-pink-600 font-bold">
              ₹{Number(sweet.price).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">{sweet.quantity} left</div>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-3 flex-1">{sweet.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => onPurchaseClick(sweet)}
              disabled={sweet.quantity <= 0}
              variant={sweet.quantity <= 0 ? "secondary" : "primary"}
              className={`${
                sweet.quantity <= 0 ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              Purchase
            </Button>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button onClick={() => onEdit?.(sweet)} variant="secondary">
                Edit
              </Button>
              <Button onClick={() => onDelete?.(sweet)} variant="danger">
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchFilter({
  value,
  onChange,
  categories,
  onCategoryChange,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: string[];
  onCategoryChange: (c: string) => void;
}) {
  return (
    <div className="flex gap-3 items-center w-full">
      <div className="flex-1">
        <Input
          placeholder="Search sweets by name or description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <select
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-3 py-2 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-pink-300"
      >
        <option value="">All</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ----------------------- Admin Panel ----------------------- */

function AdminPanel({ onAdded }: { onAdded?: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = {
        name,
        description: desc,
        price: Number(price) || 0,
        quantity: Number(quantity) || 0,
        imageUrl,
        category,
      };
      await apiFetch("/sweets", { method: "POST", body: JSON.stringify(body) });
      setName("");
      setDesc("");
      setPrice("");
      setQuantity("");
      setImageUrl("");
      setCategory("");
      onAdded?.();
    } catch (err: any) {
      setError(err?.data?.message || "Could not add sweet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="font-semibold mb-3 text-gray-800">
        Admin — Add new sweet
      </h3>
      {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="md:col-span-2"
        />
        <Input
          placeholder="Price"
          value={price as any}
          onChange={(e) =>
            setPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          type="number"
          step="0.01"
        />
        <Input
          placeholder="Quantity"
          value={quantity as any}
          onChange={(e) =>
            setQuantity(e.target.value === "" ? "" : Number(e.target.value))
          }
          type="number"
        />
        <textarea
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="px-4 py-2 rounded-2xl border border-gray-200 md:col-span-2"
        />
        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          className="md:col-span-2"
        >
          {loading ? "Adding..." : "Add Sweet"}
        </Button>
      </form>
    </Card>
  );
}

/* ----------------------- Edit Form Modal ----------------------- */

function EditSweetForm({
  sweet,
  onCancel,
  onSave,
}: {
  sweet: Sweet;
  onCancel: () => void;
  onSave: (s: Sweet) => Promise<void>;
}) {
  const [form, setForm] = useState<Sweet>({ ...sweet });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl"
      >
        <h3 className="text-lg font-semibold mb-3">Edit sweet</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="md:col-span-2"
          />
          <Input
            type="number"
            value={form.price as any}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
            }
          />
          <Input
            type="number"
            value={form.quantity as any}
            onChange={(e) =>
              setForm({ ...form, quantity: Number(e.target.value) })
            }
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="px-4 py-2 rounded-2xl border border-gray-200 md:col-span-2"
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ----------------------- Main App ----------------------- */

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const auth = useAuth();
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [editing, setEditing] = useState<Sweet | null>(null);
  const [tab, setTab] = useState<"login" | "register">("login");

  useEffect(() => {
    fetchSweets();
  }, []);

  async function fetchSweets() {
    setLoading(true);
    try {
      const data = await apiFetch("/sweets");
      setSweets((data as Sweet[]) || []);
      setCategories(
        Array.from(
          new Set(
            ((data as Sweet[]) || []).map((s) => s.category || "Uncategorized")
          )
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(s: Sweet) {
    const str = prompt("Quantity to purchase", "1");
    if (!str) return;
    const qty = Number(str);
    if (!qty || qty <= 0) return alert("Enter a valid quantity");
    try {
      await apiFetch(
        `/sweets/${encodeURIComponent((s.id ?? s._id) || "")}/purchase`,
        { method: "POST", body: JSON.stringify({ quantity: qty }) }
      );
      alert("Purchase successful");
      fetchSweets();
    } catch (err: any) {
      alert(err?.data?.message || "Purchase failed");
    }
  }

  async function handleDelete(s: Sweet) {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    try {
      await apiFetch(`/sweets/${encodeURIComponent((s.id ?? s._id) || "")}`, {
        method: "DELETE",
      });
      fetchSweets();
    } catch (err: any) {
      alert(err?.data?.message || "Delete failed");
    }
  }

  async function handleEditSubmit(updated: Sweet) {
    try {
      await apiFetch(
        `/sweets/${encodeURIComponent((updated.id ?? updated._id) || "")}`,
        { method: "PUT", body: JSON.stringify(updated) }
      );
      setEditing(null);
      fetchSweets();
    } catch (err: any) {
      alert(err?.data?.message || "Update failed");
    }
  }

  const filtered = sweets.filter((s) => {
    const text = (s.name + " " + (s.description || "")).toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory = category
      ? (s.category || "Uncategorized") === category
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <header className="max-w-6xl mx-auto p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center text-white text-lg shadow-md">
            🍬
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">SweetShop</h1>
            <div className="text-sm text-gray-500">
              Delicious treats, delivered.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {auth.user ? (
            <>
              <div className="text-sm text-gray-700">
                Hi, <strong>{auth.user.name}</strong>{" "}
                {auth.user.isAdmin && (
                  <span className="ml-2 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                    Admin
                  </span>
                )}
              </div>
              <Button onClick={() => auth.logout()} variant="secondary">
                Logout
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow">
              <Button
                onClick={() => setTab("login")}
                variant={tab === "login" ? "primary" : "secondary"}
                className={tab === "login" ? "" : ""}
              >
                Sign in
              </Button>
              <Button
                onClick={() => setTab("register")}
                variant={tab === "register" ? "primary" : "secondary"}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section className="lg:col-span-3">
          <div className="mb-4">
            <SearchFilter
              value={search}
              onChange={setSearch}
              categories={categories}
              onCategoryChange={setCategory}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full text-center py-24">
                Loading sweets...
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-24">
                No sweets found
              </div>
            ) : (
              filtered.map((s) => (
                <SweetsCard
                  key={(s.id ?? s._id) || s.name}
                  sweet={s}
                  onPurchaseClick={handlePurchase}
                  isAdmin={!!auth.user?.isAdmin}
                  onEdit={(ss) => setEditing(ss)}
                  onDelete={(ss) => handleDelete(ss)}
                />
              ))
            )}
          </div>
        </section>

        <aside className="space-y-4">
          {!auth.user ? (
            <div className="sticky top-6">
              {tab === "login" ? (
                <LoginForm onSuccess={fetchSweets} />
              ) : (
                <RegisterForm onSuccess={fetchSweets} />
              )}
            </div>
          ) : auth.user.isAdmin ? (
            <div className="sticky top-6">
              <AdminPanel onAdded={fetchSweets} />
            </div>
          ) : (
            <Card>
              <h4 className="font-semibold text-gray-800">Account</h4>
              <p className="text-sm text-gray-600 mt-2">
                Welcome back — enjoy browsing sweets. Purchase from the list to
                reduce inventory.
              </p>
            </Card>
          )}

          <Card>
            <h4 className="font-semibold text-gray-800">Quick stats</h4>
            <div className="text-sm text-gray-600 mt-2">
              Total sweets: <strong>{sweets.length}</strong>
            </div>
            <div className="text-sm text-gray-600">
              Categories: <strong>{categories.length}</strong>
            </div>
          </Card>
        </aside>
      </main>

      {editing && (
        <EditSweetForm
          sweet={editing}
          onCancel={() => setEditing(null)}
          onSave={async (s) => await handleEditSubmit(s)}
        />
      )}

      <footer className="max-w-6xl mx-auto p-6 text-center text-sm text-gray-500">
        Built with ❤️ — Ensure your backend runs at{" "}
        <code className="bg-gray-100 px-1 py-0.5 rounded">{API_BASE}</code> and
        has CORS enabled.
      </footer>
    </div>
  );
}
