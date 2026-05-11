import { useCallback, useEffect, useState } from "react";
import {
  Search, ArrowLeft, Loader2, Lock, Trash2,
  ChevronDown, ChevronUp, Phone, Mail, MapPin, Image,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

type LeadStatus = "new" | "contacted" | "consultation_scheduled" | "estimate_sent" | "won" | "lost" | "archived";

interface Submission {
  id: number;
  name: string;
  email: string;
  phone: string;
  zipCode: string;
  serviceType: string;
  projectSummary: string;
  uploads?: Array<{ url: string; name: string; type: string; size: number }>;
  source: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = "/api";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  consultation_scheduled: "Consultation",
  estimate_sent: "Estimate Sent",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  consultation_scheduled: "bg-purple-100 text-purple-700",
  estimate_sent: "bg-orange-100 text-orange-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
  archived: "bg-gray-100 text-gray-500",
};

const ALL_STATUSES: LeadStatus[] = ["new", "contacted", "consultation_scheduled", "estimate_sent", "won", "lost", "archived"];

const SERVICE_TYPES = ["Fencing", "Decks", "Carpentry", "Punch List Items", "Home Repairs", "Other"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-black/30" />
      <span className="text-black/40">{label}:</span>
      <span className="text-black/70">{value}</span>
    </div>
  );
}

export default function AdminPage() {
  const [keyInput, setKeyInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesInput, setNotesInput] = useState("");

  const fetchSubmissions = useCallback(
    async (searchQuery: string, status: string, service: string) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (status) params.set("status", status);
        if (service) params.set("serviceType", service);
        const qs = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`${API_BASE}/admin/submissions${qs}`, {
          credentials: "include",
        });
        if (res.status === 401) {
          setAuthenticated(false);
          setAuthError("Session expired. Please sign in again.");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSubmissions(data.submissions);
      } catch {
        setError("Failed to load submissions. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateStatus = async (id: number, status: LeadStatus) => {
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/submissions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchSubmissions(search, statusFilter, serviceFilter);
    } catch {
      setError("Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const saveNotes = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/admin/submissions/${id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: notesInput }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
      await fetchSubmissions(search, statusFilter, serviceFilter);
      setEditingNotesId(null);
    } catch {
      setError("Failed to save notes.");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteSubmission = async (id: number) => {
    setActionLoading(id);
    setDeleteConfirmId(null);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/submissions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Failed to delete submission.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const key = keyInput.trim();
    if (!key) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key }),
      });
      if (res.status === 401) {
        setAuthError("Invalid admin key");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to authenticate");
      setKeyInput("");
      setAuthenticated(true);
      await fetchSubmissions("", "", "");
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    setAuthenticated(false);
    setKeyInput("");
    setSubmissions([]);
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/session`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAuthenticated(true);
            await fetchSubmissions("", "", "");
          }
        }
      } catch {} finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [fetchSubmissions]);

  useEffect(() => {
    if (!authenticated) return;
    const timeout = setTimeout(() => {
      fetchSubmissions(search, statusFilter, serviceFilter);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, serviceFilter, authenticated, fetchSubmissions]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f2ec]">
        <Loader2 className="h-6 w-6 animate-spin text-black/30" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f2ec] px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8">
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5">
                <Lock className="h-5 w-5 text-black/50" />
              </div>
              <h1 className="text-xl font-medium tracking-tight">Admin Access</h1>
              <p className="text-center text-sm text-black/50">Enter the admin key to view leads.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Admin key"
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25 focus:ring-1 focus:ring-black/10"
                autoFocus
              />
              {authError && <p className="text-sm text-red-600">{authError}</p>}
              <Button type="submit" className="h-11 w-full" disabled={loading || !keyInput.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <a href={import.meta.env.BASE_URL} className="text-sm text-black/40 transition hover:text-black/60">&larr; Back to site</a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ec] text-[#171717] antialiased">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f5f2ec]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <a href={import.meta.env.BASE_URL}>
              <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" />Site</Button>
            </a>
            <h1 className="text-sm font-medium uppercase tracking-wider text-black/70">Leads</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-black/40">{submissions.length} total</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Sign Out</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, ZIP, or project..."
              className="h-11 w-full rounded-xl border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black/25 focus:ring-1 focus:ring-black/10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant={statusFilter === "" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("")}>All</Button>
            {ALL_STATUSES.map((s) => (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
                {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-9 rounded-lg border border-black/10 bg-white px-3 text-xs outline-none"
            >
              <option value="">All services</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading && submissions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-black/30" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-20 text-center text-sm text-black/40">
            {search || statusFilter || serviceFilter ? "No leads match your filters." : "No leads yet."}
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => {
              const isExpanded = expandedId === s.id;
              return (
                <Card key={s.id} className="transition hover:border-black/10">
                  <CardContent className="p-5 md:p-6">
                    <div className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
                          <span className="font-medium">{s.name}</span>
                          {s.serviceType && (
                            <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-black/60">{s.serviceType}</span>
                          )}
                          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] || STATUS_COLORS.new}`}>
                            {STATUS_LABELS[s.status] || s.status}
                          </span>
                          {s.source && s.source !== "web" && (
                            <span className="text-xs text-black/35">{s.source.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-black/35">{formatDate(s.createdAt)}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-black/25" /> : <ChevronDown className="h-4 w-4 text-black/25" />}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/45">
                        {s.email && <span>{s.email}</span>}
                        {s.phone && <span>{s.phone}</span>}
                        {s.zipCode && <span>ZIP {s.zipCode}</span>}
                      </div>

                      {s.projectSummary && (
                        <div className="mt-2 text-sm text-black/60 line-clamp-2">{s.projectSummary}</div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-black/5 pt-4">
                        <div className="grid gap-2">
                          <DetailRow icon={Mail} label="Email" value={s.email} />
                          <DetailRow icon={Phone} label="Phone" value={s.phone} />
                          <DetailRow icon={MapPin} label="ZIP Code" value={s.zipCode} />
                        </div>

                        {s.projectSummary && (
                          <div>
                            <div className="mb-1 text-xs font-medium text-black/40">Project Summary</div>
                            <div className="rounded-xl bg-black/[0.03] p-4 text-sm leading-relaxed text-black/60">{s.projectSummary}</div>
                          </div>
                        )}

                        {Array.isArray(s.uploads) && s.uploads.length > 0 && (
                          <div>
                            <div className="mb-1 text-xs font-medium text-black/40">Project Photos</div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {s.uploads.map((upload) => (
                                <a
                                  key={upload.url}
                                  href={`${API_BASE}/storage${upload.url.replace(/^\/objects/, "/objects")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-3 rounded-xl bg-black/[0.03] p-3 text-sm text-black/60 transition hover:bg-black/[0.05]"
                                >
                                  <Image className="h-4 w-4 shrink-0 text-black/35" />
                                  <span className="truncate">{upload.name || "Project photo"}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-black/40">Internal Notes</span>
                            {editingNotesId !== s.id && (
                              <button
                                className="text-xs text-black/40 hover:text-black/60"
                                onClick={() => { setEditingNotesId(s.id); setNotesInput(s.notes || ""); }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          {editingNotesId === s.id ? (
                            <div className="space-y-2">
                              <textarea
                                className="w-full rounded-xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-black/25"
                                rows={3}
                                value={notesInput}
                                onChange={(e) => setNotesInput(e.target.value)}
                                placeholder="Add internal notes..."
                              />
                              <div className="flex gap-2">
                                <Button size="sm" disabled={actionLoading === s.id} onClick={() => saveNotes(s.id)}>
                                  {actionLoading === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingNotesId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl bg-black/[0.03] p-3 text-sm text-black/50 min-h-[40px]">
                              {s.notes || "No notes yet."}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="mb-2 text-xs font-medium text-black/40">Update Status</div>
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_STATUSES.filter((st) => st !== s.status).map((st) => (
                              <Button
                                key={st}
                                variant="outline"
                                size="sm"
                                disabled={actionLoading === s.id}
                                onClick={() => updateStatus(s.id, st)}
                              >
                                {actionLoading === s.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                {STATUS_LABELS[st]}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-end border-t border-black/5 pt-3">
                          {deleteConfirmId === s.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-600">Delete permanently?</span>
                              <Button variant="destructive" size="sm" disabled={actionLoading === s.id} onClick={() => deleteSubmission(s.id)}>
                                {actionLoading === s.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}
                                Confirm
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={actionLoading === s.id}
                              onClick={() => setDeleteConfirmId(s.id)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
