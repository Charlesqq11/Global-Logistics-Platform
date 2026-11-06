"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Landmark, Plus, Search, RefreshCw, Pencil, Power,
  X, CheckCircle2, AlertCircle, Loader2, Wallet, CircleDollarSign
} from "lucide-react";
import Link from "next/link";

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  country?: string | null;
  bank_code?: string | null;
  swift_code?: string | null;
  iban?: string | null;
  transfer_instructions?: string | null;
  is_active: boolean;
};

type FormState = {
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  country: string;
  bank_code: string;
  swift_code: string;
  iban: string;
  transfer_instructions: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  bank_name: "",
  account_name: "",
  account_number: "",
  currency: "USD",
  country: "",
  bank_code: "",
  swift_code: "",
  iban: "",
  transfer_instructions: "",
  is_active: true,
};

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "The request could not be completed.");
  }
  return data;
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4500);
  };

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/admin/bank-accounts", {
        cache: "no-store",
      });
      const data = await parseResponse(response);
      if (!Array.isArray(data)) throw new Error("Unexpected bank accounts response.");
      setAccounts(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load bank accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const currencies = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.currency).filter(Boolean))).sort(),
    [accounts]
  );

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesCurrency = currencyFilter === "ALL" || account.currency === currencyFilter;
      const searchable = [
        account.bank_name, account.account_name, account.account_number,
        account.currency, account.country, account.swift_code, account.iban,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesCurrency && (!term || searchable.includes(term));
    });
  }, [accounts, search, currencyFilter]);

  const activeCount = accounts.filter((a) => a.is_active).length;
  const inactiveCount = accounts.length - activeCount;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (account: BankAccount) => {
    setEditing(account);
    setForm({
      bank_name: account.bank_name || "",
      account_name: account.account_name || "",
      account_number: account.account_number || "",
      currency: account.currency || "USD",
      country: account.country || "",
      bank_code: account.bank_code || "",
      swift_code: account.swift_code || "",
      iban: account.iban || "",
      transfer_instructions: account.transfer_instructions || "",
      is_active: account.is_active,
    });
    setModalOpen(true);
  };

  const updateField = (field: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        bank_name: form.bank_name.trim(),
        account_name: form.account_name.trim(),
        account_number: form.account_number.trim(),
        currency: form.currency.trim().toUpperCase(),
        country: form.country.trim() || null,
        bank_code: form.bank_code.trim() || null,
        swift_code: form.swift_code.trim() || null,
        iban: form.iban.trim() || null,
        transfer_instructions: form.transfer_instructions.trim() || null,
        is_active: form.is_active,
      };

      const response = await fetch(
        editing
          ? `/api/admin/bank-accounts/${encodeURIComponent(editing.id)}`
          : "/api/admin/bank-accounts",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      await parseResponse(response);
      setModalOpen(false);
      showNotice("success", editing ? "Bank account updated." : "Bank account created.");
      await loadAccounts();
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Unable to save bank account.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAccount = async (account: BankAccount) => {
    const action = account.is_active ? "deactivate" : "activate";
    if (!window.confirm(`${action === "deactivate" ? "Deactivate" : "Activate"} ${account.bank_name}?`)) return;

    setActionId(account.id);
    try {
      const response = await fetch(
        `/api/admin/bank-accounts/${encodeURIComponent(account.id)}/${action}`,
        { method: "POST" }
      );
      await parseResponse(response);
      showNotice("success", `Bank account ${action}d successfully.`);
      await loadAccounts();
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : `Unable to ${action} account.`);
    } finally {
      setActionId(null);
    }
  };

  const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-sky-500/60";
  const labelClass = "block text-xs font-medium uppercase tracking-wider text-zinc-400";

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white">
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
                <Landmark size={23} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Payment configuration</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Bank Accounts</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-500">Manage the bank accounts available for customer payment requests.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => void loadAccounts()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300 hover:bg-white/[0.08] disabled:opacity-50">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-400">
              <Plus size={17} /> Add bank account
            </button>
          </div>
        </header>

        {notice && (
          <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}>
            {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {notice.text}
            <button onClick={() => setNotice(null)} className="ml-auto" aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total accounts", value: accounts.length, icon: Wallet, tone: "text-sky-300 bg-sky-400/10" },
            { label: "Active accounts", value: activeCount, icon: CheckCircle2, tone: "text-emerald-300 bg-emerald-400/10" },
            { label: "Inactive accounts", value: inactiveCount, icon: Power, tone: "text-amber-300 bg-amber-400/10" },
            { label: "Currencies", value: currencies.length, icon: CircleDollarSign, tone: "text-violet-300 bg-violet-400/10" },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{metric.label}</span>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}><Icon size={18} /></span>
                </div>
                <p className="mt-4 text-3xl font-semibold">{metric.value}</p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">Configured accounts</h2>
              <p className="mt-1 text-xs text-zinc-500">Bank details used when creating payment requests.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bank, account, SWIFT..." className="w-full rounded-xl border border-white/10 bg-[#090d13] py-3 pl-10 pr-4 text-sm outline-none placeholder:text-zinc-600 focus:border-sky-500/50 sm:w-72" />
              </div>
              <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#090d13] px-4 py-3 text-sm text-zinc-300 outline-none" aria-label="Filter by currency">
                <option value="ALL">All currencies</option>
                {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-zinc-500"><Loader2 size={19} className="animate-spin" /> Loading bank accounts...</div>
          ) : loadError ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <AlertCircle size={28} className="mb-3 text-red-400" />
              <p className="font-medium">Unable to load accounts</p>
              <p className="mt-2 text-sm text-zinc-500">{loadError}</p>
              <button onClick={() => void loadAccounts()} className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm">Try again</button>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Landmark size={28} className="mb-4 text-zinc-500" />
              <p className="font-medium">{accounts.length === 0 ? "No bank accounts yet" : "No matching accounts"}</p>
              <p className="mt-2 max-w-sm text-sm text-zinc-500">
                {accounts.length === 0 ? "Add a bank account to make it available for payment requests." : "Try another search term or currency filter."}
              </p>
              {accounts.length === 0 && <button onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold"><Plus size={16} /> Add first account</button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Bank / account</th>
                    <th className="px-6 py-4 font-medium">Account number</th>
                    <th className="px-6 py-4 font-medium">Currency</th>
                    <th className="px-6 py-4 font-medium">Country</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-white/[0.025]">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300"><Landmark size={18} /></div>
                          <div><p className="font-medium">{account.bank_name}</p><p className="mt-1 text-xs text-zinc-500">{account.account_name}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-sm text-zinc-300">{account.account_number}</td>
                      <td className="px-6 py-5"><span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold">{account.currency}</span></td>
                      <td className="px-6 py-5 text-sm text-zinc-400">{account.country || "—"}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium ${account.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-500/10 text-zinc-400"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${account.is_active ? "bg-emerald-400" : "bg-zinc-500"}`} />
                          {account.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(account)} title="Edit account" className="rounded-lg border border-white/10 p-2.5 text-zinc-400 hover:border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-300"><Pencil size={15} /></button>
                          <button onClick={() => void toggleAccount(account)} disabled={actionId === account.id} title={account.is_active ? "Deactivate account" : "Activate account"} className="rounded-lg border border-white/10 p-2.5 text-zinc-400 hover:bg-white/[0.06] disabled:opacity-50">
                            {actionId === account.id ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-white/[0.06] px-6 py-4 text-xs text-zinc-500">Showing {filteredAccounts.length} of {accounts.length} accounts</div>
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-sm">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b1018] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">Bank account settings</p>
                <h2 className="mt-1 text-lg font-semibold">{editing ? "Edit bank account" : "Add bank account"}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-white" aria-label="Close modal"><X size={19} /></button>
            </div>

            <form onSubmit={saveAccount} className="space-y-5 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>Bank name *
                  <input required maxLength={120} value={form.bank_name} onChange={(e) => updateField("bank_name", e.target.value)} className={inputClass} placeholder="Bank name" />
                </label>
                <label className={labelClass}>Account name *
                  <input required maxLength={160} value={form.account_name} onChange={(e) => updateField("account_name", e.target.value)} className={inputClass} placeholder="Registered account holder" />
                </label>
                <label className={labelClass}>Account number *
                  <input required maxLength={64} value={form.account_number} onChange={(e) => updateField("account_number", e.target.value)} className={inputClass} placeholder="Account number" />
                </label>
                <label className={labelClass}>Currency *
                  <select required value={form.currency} onChange={(e) => updateField("currency", e.target.value)} className={inputClass}>
                    {["USD", "EUR", "GBP", "NGN", "CAD", "AUD", "AED", "CNY", "GHS", "ZAR"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className={labelClass}>Country
                  <input maxLength={100} value={form.country} onChange={(e) => updateField("country", e.target.value)} className={inputClass} placeholder="Country" />
                </label>
                <label className={labelClass}>Bank code
                  <input maxLength={64} value={form.bank_code} onChange={(e) => updateField("bank_code", e.target.value)} className={inputClass} placeholder="Optional" />
                </label>
                <label className={labelClass}>SWIFT / BIC
                  <input maxLength={32} value={form.swift_code} onChange={(e) => updateField("swift_code", e.target.value)} className={inputClass} placeholder="Optional" />
                </label>
                <label className={labelClass}>IBAN
                  <input maxLength={64} value={form.iban} onChange={(e) => updateField("iban", e.target.value)} className={inputClass} placeholder="Optional" />
                </label>
              </div>

              <label className={labelClass}>Transfer instructions
                <textarea rows={3} maxLength={2000} value={form.transfer_instructions} onChange={(e) => updateField("transfer_instructions", e.target.value)} className={inputClass} placeholder="Instructions customers should follow when making a transfer..." />
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <input type="checkbox" checked={form.is_active} onChange={(e) => updateField("is_active", e.target.checked)} className="h-4 w-4 accent-sky-500" />
                <span><span className="block text-sm font-medium">Account is active</span><span className="mt-1 block text-xs text-zinc-500">Active accounts can be selected for new payment requests.</span></span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300 hover:bg-white/[0.05]">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold hover:bg-sky-400 disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? "Saving..." : editing ? "Save changes" : "Create account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
