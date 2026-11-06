"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  country: string | null;
  is_active: boolean;
};

type CreatePaymentRequestModalProps = {
  customsCaseId: string;
  onClose: () => void;
  onCreated: () => void;
};

const providers = [
  { value: "manual", label: "Manual" },
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
];

export default function CreatePaymentRequestModal({
  customsCaseId,
  onClose,
  onCreated,
}: CreatePaymentRequestModalProps) {
  const [description, setDescription] = useState(
    "Customs clearance and processing fee",
  );
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [provider, setProvider] = useState("manual");
  const [dueAt, setDueAt] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(true);
  const [bankAccountError, setBankAccountError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBankAccounts() {
      setLoadingBankAccounts(true);
      setBankAccountError("");

      try {
        const response = await fetch(
          "/api/admin/bank-accounts?active_only=true",
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ?? "Unable to load bank accounts.",
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("The bank-account response was invalid.");
        }

        if (active) {
          setBankAccounts(data.filter(
            (account: BankAccount) => account.is_active,
          ));
        }
      } catch (err) {
        if (active) {
          setBankAccountError(
            err instanceof Error
              ? err.message
              : "Unable to load bank accounts.",
          );
        }
      } finally {
        if (active) {
          setLoadingBankAccounts(false);
        }
      }
    }

    loadBankAccounts();

    return () => {
      active = false;
    };
  }, []);

  const matchingBankAccounts = useMemo(
    () =>
      bankAccounts.filter(
        (account) =>
          account.currency.toUpperCase() === currency.trim().toUpperCase(),
      ),
    [bankAccounts, currency],
  );

  function handleCurrencyChange(value: string) {
    const nextCurrency = value.toUpperCase().slice(0, 3);
    setCurrency(nextCurrency);

    const selectedAccount = bankAccounts.find(
      (account) => account.id === selectedBankAccountId,
    );

    if (
      selectedAccount &&
      selectedAccount.currency.toUpperCase() !== nextCurrency
    ) {
      setSelectedBankAccountId("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);
    const normalizedCurrency = currency.trim().toUpperCase();

    if (!description.trim()) {
      setError("Payment description is required.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid payment amount greater than zero.");
      return;
    }

    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setError("Currency must be a valid 3-letter code.");
      return;
    }

    if (
      selectedBankAccountId &&
      !matchingBankAccounts.some(
        (account) => account.id === selectedBankAccountId,
      )
    ) {
      setError("Select a bank account matching the payment currency.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/payments/customs/${encodeURIComponent(customsCaseId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            description: description.trim(),
            amount: numericAmount,
            currency: normalizedCurrency,
            provider,
            due_at: dueAt ? new Date(dueAt).toISOString() : null,
            bank_account_id: selectedBankAccountId || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ?? "Unable to create the payment request.",
        );
      }

      onCreated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the payment request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f17] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Customs finance
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                Create Payment Request
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Create a controlled payment request linked to this customs case.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="payment-description"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
              >
                Description
              </label>
              <input
                id="payment-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/25 focus:bg-white/[0.06]"
                placeholder="Describe what the payment covers"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
              <div>
                <label
                  htmlFor="payment-amount"
                  className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
                >
                  Amount
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/[0.06]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="payment-currency"
                  className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
                >
                  Currency
                </label>
                <input
                  id="payment-currency"
                  value={currency}
                  onChange={(event) => handleCurrencyChange(event.target.value)}
                  maxLength={3}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold uppercase text-white outline-none transition focus:border-white/25 focus:bg-white/[0.06]"
                  placeholder="USD"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="payment-bank-account"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
              >
                Customer Bank Transfer Account
              </label>

              <select
                id="payment-bank-account"
                value={selectedBankAccountId}
                onChange={(event) =>
                  setSelectedBankAccountId(event.target.value)
                }
                disabled={loadingBankAccounts}
                className="w-full rounded-2xl border border-white/10 bg-[#111722] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25 disabled:cursor-wait disabled:opacity-60"
              >
                <option value="">
                  {loadingBankAccounts
                    ? "Loading bank accounts..."
                    : "No bank account selected"}
                </option>
                {matchingBankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} — {account.account_name} · {account.currency}
                  </option>
                ))}
              </select>

              {selectedBankAccountId && (
                <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                  {(() => {
                    const account = matchingBankAccounts.find(
                      (item) => item.id === selectedBankAccountId,
                    );

                    if (!account) return null;

                    return (
                      <>
                        <p className="text-sm font-semibold text-emerald-200">
                          {account.bank_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-300">
                          {account.account_name}
                        </p>
                        <p className="mt-1 font-mono text-sm tracking-wide text-white">
                          {account.account_number}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {account.currency}
                          {account.country ? ` · ${account.country}` : ""}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              {bankAccountError ? (
                <p className="mt-2 text-xs text-amber-300">
                  Bank accounts could not be loaded: {bankAccountError}
                  You can still create the request without a bank account.
                </p>
              ) : !loadingBankAccounts && matchingBankAccounts.length === 0 ? (
                <p className="mt-2 text-xs text-amber-300">
                  No active bank account matches {currency.toUpperCase() || "this currency"}.
                  You can create the request without one, or add a matching account first.
                </p>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Only active accounts matching the payment currency are shown.
                  The selected account details will be saved with this request.
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="payment-provider"
                  className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
                >
                  Payment Provider
                </label>
                <select
                  id="payment-provider"
                  value={provider}
                  onChange={(event) => setProvider(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#111722] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
                >
                  {providers.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="payment-due"
                  className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
                >
                  Due Date
                </label>
                <input
                  id="payment-due"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/[0.06]"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                  $
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Payment control
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Creating this request will place the customs case into a
                    payment-required state. Creating a request does not record
                    payment or approve a transfer. Customs clearance remains
                    blocked until payment is verified and recorded as paid.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating Request..." : "Create Payment Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
