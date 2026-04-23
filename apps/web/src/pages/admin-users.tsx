import React, { useEffect, useState } from "react";
import Layout from "@/components/layout";

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reset password
  const [resetId, setResetId] = useState<number | null>(null);
  const [newPw, setNewPw] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ id: number; ok: boolean; text: string } | null>(null);

  // Delete
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // Role change
  const [roleLoading, setRoleLoading] = useState<number | null>(null);

  // Create user
  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPw, setCreatePw] = useState("");
  const [createRole, setCreateRole] = useState<"user" | "admin">("user");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/admin/users`, { credentials: "include" })
      .then(r => r.json())
      .then(setUsers)
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!createEmail || createPw.length < 8) return;
    setCreateLoading(true);
    setCreateError("");
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}api/admin/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: createEmail, password: createPw, role: createRole }),
      });
      const data = await r.json();
      if (!r.ok) { setCreateError(data.error ?? "Failed to create user"); return; }
      setUsers(u => [...u, data]);
      setShowCreate(false);
      setCreateEmail("");
      setCreatePw("");
      setCreateRole("user");
    } catch {
      setCreateError("Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleResetPassword(id: number) {
    if (newPw.length < 8) return;
    setResetLoading(true);
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}api/admin/users/${id}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPw }),
      });
      const ok = r.ok;
      setResetMsg({ id, ok, text: ok ? "Password updated" : "Failed to reset" });
      if (ok) { setResetId(null); setNewPw(""); }
    } finally {
      setResetLoading(false);
      setTimeout(() => setResetMsg(null), 3000);
    }
  }

  async function handleChangeRole(id: number, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setRoleLoading(id);
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}api/admin/users/${id}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (r.ok) setUsers(u => u.map(u => u.id === id ? { ...u, role: newRole } : u));
    } finally {
      setRoleLoading(null);
    }
  }

  async function handleDelete(id: number, email: string) {
    if (!window.confirm(`Delete ${email}? This cannot be undone.`)) return;
    setDeleteLoading(id);
    try {
      await fetch(`${import.meta.env.BASE_URL}api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      setUsers(u => u.filter(u => u.id !== id));
    } finally {
      setDeleteLoading(null);
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-white/40 text-sm mt-1">
              {loading ? "Loading…" : `${users.length} account${users.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => { setShowCreate(v => !v); setCreateError(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold gradient-primary text-white hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New User
          </button>
        </div>

        {/* Create user form */}
        {showCreate && (
          <div className="mb-6 rounded-xl border border-white/[0.10] bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white mb-3">Create New Account</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Email"
                value={createEmail}
                onChange={e => setCreateEmail(e.target.value)}
                className="flex-1 bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/40"
              />
              <input
                type="password"
                placeholder="Password (min 8 chars)"
                value={createPw}
                onChange={e => setCreatePw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                className="flex-1 bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/40"
              />
              <select
                value={createRole}
                onChange={e => setCreateRole(e.target.value as "user" | "admin")}
                className="bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleCreate}
                disabled={createLoading || !createEmail || createPw.length < 8}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/20 hover:bg-orange-500/25 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {createLoading ? "Creating…" : "Create"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </div>
            {createError && <p className="text-xs text-red-400 mt-2">{createError}</p>}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-red-400 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  <th className="text-left text-xs font-medium text-white/35 uppercase tracking-wide px-4 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-white/35 uppercase tracking-wide px-4 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-white/35 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <React.Fragment key={u.id}>
                    <tr className="border-b border-white/[0.05]">
                      <td className="px-4 py-3 text-sm text-white/80 font-medium">{u.email}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleChangeRole(u.id, u.role)}
                          disabled={roleLoading === u.id}
                          title="Click to toggle role"
                          className={`text-xs font-medium px-2 py-0.5 rounded-md border transition-all disabled:opacity-40 ${
                            u.role === "admin"
                              ? "bg-orange-500/15 text-orange-400 border-orange-500/20 hover:bg-orange-500/25"
                              : "bg-white/[0.06] text-white/50 border-white/[0.08] hover:bg-white/[0.12] hover:text-white/70"
                          }`}
                        >
                          {roleLoading === u.id ? "…" : u.role}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/35 hidden sm:table-cell">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPw(""); setResetMsg(null); }}
                            className="text-xs text-orange-400/70 hover:text-orange-400 transition-colors font-medium"
                          >
                            Reset pw
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.email)}
                            disabled={deleteLoading === u.id}
                            className="text-xs text-red-400/60 hover:text-red-400 transition-colors font-medium disabled:opacity-40"
                          >
                            {deleteLoading === u.id ? "…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {resetId === u.id && (
                      <tr className="bg-orange-500/[0.04] border-b border-orange-500/10">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              placeholder="New password (min 8 chars)"
                              value={newPw}
                              onChange={e => setNewPw(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && handleResetPassword(u.id)}
                              autoFocus
                              className="flex-1 bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/40"
                            />
                            <button
                              onClick={() => handleResetPassword(u.id)}
                              disabled={resetLoading || newPw.length < 8}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/20 hover:bg-orange-500/25 transition-colors disabled:opacity-40"
                            >
                              {resetLoading ? "…" : "Save"}
                            </button>
                            <button
                              onClick={() => setResetId(null)}
                              className="text-xs text-white/30 hover:text-white/60 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                          {resetMsg?.id === u.id && (
                            <p className={`text-xs mt-1.5 ${resetMsg.ok ? "text-green-400" : "text-red-400"}`}>
                              {resetMsg.text}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}