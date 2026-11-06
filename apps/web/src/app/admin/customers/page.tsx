"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  CircleUserRound,
  Globe2,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  UserPlus,
  X,
} from "lucide-react";

type Customer = {
  id: string;
  customer_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  country: string | null;
  preferred_language: string;
  is_active: boolean;
};

type Staff = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
};

type CustomerForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  country: string;
  preferred_language: string;
  notes: string;
};

type StaffForm = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

const emptyCustomerForm: CustomerForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company_name: "",
  country: "",
  preferred_language: "en",
  notes: "",
};

const emptyStaffForm: StaffForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
};

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg ?? "Invalid input")
        .join(", ");
    }

    return "The request could not be completed.";
  } catch {
    return "The request could not be completed.";
  }
}

function initials(customer: Customer) {
  return `${customer.first_name?.[0] ?? ""}${customer.last_name?.[0] ?? ""}`.toUpperCase();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [customerForm, setCustomerForm] =
    useState<CustomerForm>(emptyCustomerForm);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [staffMode, setStaffMode] = useState<"create" | "link">("create");
  const [staffForm, setStaffForm] = useState<StaffForm>(emptyStaffForm);
  const [linkEmail, setLinkEmail] = useState("");
  const [staffSaving, setStaffSaving] = useState(false);

  const [removingStaff, setRemovingStaff] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/customers", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data: Customer[] = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStaff = useCallback(async (customerId: string) => {
    setStaffLoading(true);

    try {
      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(customerId)}/staff`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data: Staff[] = await response.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to load staff.",
      );
      setStaff([]);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) => {
      const searchable = [
        customer.first_name,
        customer.last_name,
        customer.customer_code,
        customer.email,
        customer.phone,
        customer.company_name,
        customer.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [customers, search]);

  const activeCount = customers.filter(
    (customer) => customer.is_active,
  ).length;

  const companyCount = customers.filter(
    (customer) => Boolean(customer.company_name?.trim()),
  ).length;

  const individualCount = customers.length - companyCount;

  async function createCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingCustomer(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...customerForm,
          email: customerForm.email.trim() || null,
          phone: customerForm.phone.trim() || null,
          company_name: customerForm.company_name.trim() || null,
          country: customerForm.country.trim() || null,
          notes: customerForm.notes.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setShowCreate(false);
      setCustomerForm(emptyCustomerForm);
      setNotice("Customer created successfully.");
      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Customer creation failed.",
      );
    } finally {
      setCreatingCustomer(false);
    }
  }

  function openCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setStaff([]);
    setStaffMode("create");
    setStaffForm(emptyStaffForm);
    setLinkEmail("");
    setNotice("");
    void loadStaff(customer.id);
  }

  async function createStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCustomer) return;

    setStaffSaving(true);
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(selectedCustomer.id)}/staff`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(staffForm),
        },
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setStaffForm(emptyStaffForm);
      setNotice("Customer staff account created successfully.");
      await loadStaff(selectedCustomer.id);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to create staff account.",
      );
    } finally {
      setStaffSaving(false);
    }
  }

  async function linkStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCustomer) return;

    setStaffSaving(true);
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(selectedCustomer.id)}/staff/link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: linkEmail.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setLinkEmail("");
      setNotice("Existing account linked successfully.");
      await loadStaff(selectedCustomer.id);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to link account.",
      );
    } finally {
      setStaffSaving(false);
    }
  }

  async function unlinkStaff(user: Staff) {
    if (!selectedCustomer) return;

    const confirmed = window.confirm(
      `Unlink ${user.first_name} ${user.last_name} from this customer? The user account itself will not be deleted.`,
    );

    if (!confirmed) return;

    setRemovingStaff(user.id);
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(selectedCustomer.id)}/staff/${encodeURIComponent(user.id)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setNotice("Staff member unlinked successfully.");
      await loadStaff(selectedCustomer.id);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to unlink staff member.",
      );
    } finally {
      setRemovingStaff(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#080d16] text-slate-100">
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">

        <header className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <Link
              href="/admin"
              className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
            >
              <ArrowLeft size={15} />
              Back to overview
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Users size={21} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-400">
                  Relationship management
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Customers
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-xl text-sm text-slate-400">
              Manage customer records, portal access and authorized staff.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void loadCustomers()}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <button
              onClick={() => {
                setError("");
                setCustomerForm(emptyCustomerForm);
                setShowCreate(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <Plus size={17} />
              Add customer
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {notice && !selectedCustomer && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {notice}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total customers",
              value: customers.length,
              icon: Users,
            },
            {
              label: "Active customers",
              value: activeCount,
              icon: ShieldCheck,
            },
            {
              label: "Business accounts",
              value: companyCount,
              icon: Building2,
            },
            {
              label: "Individual accounts",
              value: individualCount,
              icon: CircleUserRound,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-white/[0.07] bg-[#101825] p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <Icon size={18} className="text-cyan-400" />
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight">
                  {item.value}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Live database records
                </p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101825]">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">Customer directory</h2>
              <p className="mt-1 text-xs text-slate-500">
                Customer records from your operations database
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers..."
                className="w-full rounded-xl border border-white/10 bg-[#080d16] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-400">
              <Loader2 className="animate-spin" size={19} />
              Loading customer records...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-500">
                <Users size={24} />
              </div>
              <h3 className="font-medium">
                {customers.length === 0
                  ? "No customer records found"
                  : "No matching customers"}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {customers.length === 0
                  ? "Customer records will appear here when they are created."
                  : "Try another name, email, company or customer code."}
              </p>
              {customers.length === 0 && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
                >
                  <Plus size={16} />
                  Create first customer
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(120px,0.8fr)_100px_110px] gap-4 border-b border-white/[0.06] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 lg:grid">
                <span>Customer</span>
                <span>Contact</span>
                <span>Location</span>
                <span>Status</span>
                <span className="text-right">Details</span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => openCustomer(customer)}
                    className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-white/[0.025] sm:px-6 lg:grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(120px,0.8fr)_100px_110px] lg:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-sm font-semibold text-cyan-300">
                        {initials(customer)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {customer.first_name} {customer.last_name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {customer.company_name || customer.customer_code}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-600">
                          {customer.customer_code}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-300">
                        {customer.email || "No email provided"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {customer.phone || "No phone provided"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin size={14} className="shrink-0 text-slate-600" />
                      {customer.country || "Not specified"}
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold ${
                          customer.is_active
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-cyan-300 lg:justify-end">
                      <span className="lg:hidden">View details</span>
                      <span className="hidden lg:inline">Open</span>
                      <ArrowUpRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-white/[0.06] px-6 py-4 text-xs text-slate-500">
            Showing {filteredCustomers.length} of {customers.length} customer records
          </div>
        </section>
      </div>

      {/* CREATE CUSTOMER MODAL */}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101825] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Customer registration
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Add new customer
                </h2>
              </div>

              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createCustomer} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First name">
                  <input
                    required
                    value={customerForm.first_name}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, first_name: e.target.value })
                    }
                    className="form-input"
                    placeholder="First name"
                  />
                </FormField>

                <FormField label="Last name">
                  <input
                    required
                    value={customerForm.last_name}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, last_name: e.target.value })
                    }
                    className="form-input"
                    placeholder="Last name"
                  />
                </FormField>

                <FormField label="Email address">
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, email: e.target.value })
                    }
                    className="form-input"
                    placeholder="name@company.com"
                  />
                </FormField>

                <FormField label="Phone number">
                  <input
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, phone: e.target.value })
                    }
                    className="form-input"
                    placeholder="+234..."
                  />
                </FormField>

                <FormField label="Company name">
                  <input
                    value={customerForm.company_name}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, company_name: e.target.value })
                    }
                    className="form-input"
                    placeholder="Company (optional)"
                  />
                </FormField>

                <FormField label="Country">
                  <input
                    value={customerForm.country}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, country: e.target.value })
                    }
                    className="form-input"
                    placeholder="Country"
                  />
                </FormField>

                <FormField label="Preferred language">
                  <select
                    value={customerForm.preferred_language}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        preferred_language: e.target.value,
                      })
                    }
                    className="form-input"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="ar">Arabic</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Internal notes">
                <textarea
                  rows={3}
                  value={customerForm.notes}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, notes: e.target.value })
                  }
                  className="form-input resize-none"
                  placeholder="Optional internal notes..."
                />
              </FormField>

              <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-4 text-xs leading-5 text-amber-200/80">
                Submitting this form creates a real customer record in your
                main logistics database.
              </div>

              <div className="flex justify-end gap-3 border-t border-white/[0.07] pt-5">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  disabled={creatingCustomer}
                  className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                >
                  {creatingCustomer && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Create customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS AND STAFF */}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#0c1420] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#0c1420]/95 p-5 backdrop-blur">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Customer profile
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Close customer profile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-7 p-5 sm:p-7">
              <section className="rounded-2xl border border-white/[0.08] bg-[#101825] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Customer code</p>
                    <p className="mt-2 font-mono text-sm text-cyan-300">
                      {selectedCustomer.customer_code}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold text-emerald-300">
                    {selectedCustomer.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <InfoItem
                    icon={Mail}
                    label="Email"
                    value={selectedCustomer.email || "Not provided"}
                  />
                  <InfoItem
                    icon={Building2}
                    label="Company"
                    value={selectedCustomer.company_name || "Individual"}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Country"
                    value={selectedCustomer.country || "Not specified"}
                  />
                  <InfoItem
                    icon={Globe2}
                    label="Language"
                    value={selectedCustomer.preferred_language || "en"}
                  />
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Authorized staff</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Accounts allowed to access this customer&apos;s portal.
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                    {staff.length} accounts
                  </span>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#101825]">
                  {staffLoading ? (
                    <div className="flex justify-center p-8 text-slate-400">
                      <Loader2 className="animate-spin" size={20} />
                    </div>
                  ) : staff.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="mx-auto text-slate-600" size={25} />
                      <p className="mt-3 text-sm text-slate-300">
                        No staff accounts linked
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Add or link an eligible account below.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.06]">
                      {staff.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-4 p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {user.email}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-600">
                              {user.is_active ? "Active account" : "Inactive account"}
                            </p>
                          </div>

                          <button
                            disabled={removingStaff === user.id}
                            onClick={() => void unlinkStaff(user)}
                            className="flex shrink-0 items-center gap-2 rounded-lg border border-red-400/15 px-3 py-2 text-xs text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                          >
                            {removingStaff === user.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Unlink
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-[#101825] p-5">
                <div className="mb-5">
                  <h3 className="font-semibold">Manage customer access</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Create a new staff login or link an existing eligible user.
                  </p>
                </div>

                <div className="mb-5 grid grid-cols-2 rounded-xl bg-[#080d16] p-1">
                  <button
                    onClick={() => setStaffMode("create")}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-medium transition ${
                      staffMode === "create"
                        ? "bg-cyan-400 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <UserPlus size={15} />
                    Create account
                  </button>

                  <button
                    onClick={() => setStaffMode("link")}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-medium transition ${
                      staffMode === "link"
                        ? "bg-cyan-400 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Link2 size={15} />
                    Link existing
                  </button>
                </div>

                {staffMode === "create" ? (
                  <form onSubmit={createStaff} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="First name">
                        <input
                          required
                          value={staffForm.first_name}
                          onChange={(e) =>
                            setStaffForm({
                              ...staffForm,
                              first_name: e.target.value,
                            })
                          }
                          className="form-input"
                          placeholder="First name"
                        />
                      </FormField>

                      <FormField label="Last name">
                        <input
                          required
                          value={staffForm.last_name}
                          onChange={(e) =>
                            setStaffForm({
                              ...staffForm,
                              last_name: e.target.value,
                            })
                          }
                          className="form-input"
                          placeholder="Last name"
                        />
                      </FormField>
                    </div>

                    <FormField label="Email address">
                      <input
                        required
                        type="email"
                        value={staffForm.email}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            email: e.target.value,
                          })
                        }
                        className="form-input"
                        placeholder="staff@company.com"
                      />
                    </FormField>

                    <FormField label="Temporary password">
                      <input
                        required
                        type="password"
                        minLength={12}
                        maxLength={72}
                        value={staffForm.password}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            password: e.target.value,
                          })
                        }
                        className="form-input"
                        placeholder="At least 12 characters"
                      />
                    </FormField>

                    <button
                      disabled={staffSaving}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {staffSaving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <UserPlus size={16} />
                      )}
                      Create staff account
                    </button>
                  </form>
                ) : (
                  <form onSubmit={linkStaff} className="space-y-4">
                    <FormField label="Existing account email">
                      <input
                        required
                        type="email"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        className="form-input"
                        placeholder="existing-user@company.com"
                      />
                    </FormField>

                    <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] p-4 text-xs leading-5 text-slate-400">
                      Only existing eligible user accounts can be linked.
                      Accounts with administrative roles cannot be linked as
                      customer staff.
                    </div>

                    <button
                      disabled={staffSaving}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {staffSaving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Link2 size={16} />
                      )}
                      Link existing account
                    </button>
                  </form>
                )}

                {notice && (
                  <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] p-3 text-xs text-cyan-200">
                    {notice}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .form-input {
          display: block;
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          background: #080d16;
          padding: 0.8rem 0.9rem;
          color: #f1f5f9;
          font-size: 0.875rem;
          outline: none;
        }

        .form-input::placeholder {
          color: #64748b;
        }

        .form-input:focus {
          border-color: rgba(34, 211, 238, 0.55);
        }

        .form-input option {
          background: #101825;
          color: #f1f5f9;
        }
      `}</style>
    </main>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-slate-500" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm text-slate-200">{value}</p>
      </div>
    </div>
  );
}