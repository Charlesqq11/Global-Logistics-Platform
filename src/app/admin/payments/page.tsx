"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired";

type PaymentProvider =
  | "manual"
  | "stripe"
  | "paypal";

type CustomsCase = {
  id: string;
  shipment_id: string;
  status?: string | null;
  customs_reference?: string | null;
};

type PaymentRequest = {
  id: string;
  customs_case_id: string;
  reference: string;
  description: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  due_at?: string | null;
  created_at: string;
  updated_at: string;
  customs_case?: CustomsCase | null;
};

const statusLabels: Record<
  PaymentStatus,
  string
> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
};

const providerLabels: Record<
  PaymentProvider,
  string
> = {
  manual: "Manual",
  stripe: "Stripe",
  paypal: "PayPal",
};

function formatMoney(
  amount: number | string,
  currency: string,
) {
  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return `${currency} ${amount}`;
  }

  return new Intl.NumberFormat(
    undefined,
    {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    },
  ).format(numericAmount);
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function statusClass(
  status: PaymentStatus,
) {
  switch (status) {
    case "paid":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "failed":
    case "expired":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "cancelled":
      return "border-zinc-400/20 bg-zinc-400/10 text-zinc-300";

    case "processing":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] =
    useState<PaymentRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [query, setQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | PaymentStatus>("all");

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/admin/payments",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ??
              "Unable to load payment requests.",
          );
        }

        if (active) {
          setPayments(
            Array.isArray(data)
              ? data
              : [],
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load payment requests.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPayments();

    return () => {
      active = false;
    };
  }, []);

  const filteredPayments =
    useMemo(() => {
      const normalizedQuery =
        query.trim().toLowerCase();

      return payments.filter(
        (payment) => {
          const matchesStatus =
            statusFilter === "all" ||
            payment.status === statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          return [
            payment.reference,
            payment.description,
            payment.currency,
            payment.provider,
            payment.customs_case
              ?.customs_reference,
            payment.customs_case
              ?.shipment_id,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(
                  normalizedQuery,
                ),
            );
        },
      );
    }, [
      payments,
      query,
      statusFilter,
    ]);

  const metrics = useMemo(() => {
    const total = payments.length;

    const pending = payments.filter(
      (payment) =>
        payment.status === "pending",
    ).length;

    const processing = payments.filter(
      (payment) =>
        payment.status === "processing",
    ).length;

    const paid = payments.filter(
      (payment) =>
        payment.status === "paid",
    );

    const paidAmount = paid.reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0,
    );

    const outstanding = payments
      .filter(
        (payment) =>
          payment.status === "pending" ||
          payment.status === "processing",
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount),
        0,
      );

    const exceptions = payments.filter(
      (payment) =>
        payment.status === "failed" ||
        payment.status === "expired",
    ).length;

    return {
      total,
      pending,
      processing,
      paid: paid.length,
      paidAmount,
      outstanding,
      exceptions,
    };
  }, [payments]);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
              <Link
                href="/admin"
                className="transition hover:text-white"
              >
                Operations
              </Link>

              <span>/</span>

              <span className="text-zinc-300">
                Payments
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
              Payments Control
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Monitor customs payment requests,
              settlement status, outstanding exposure,
              and payment activity across the
              logistics network.
            </p>
          </div>

          <Link
            href="/admin/payment-proofs"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 text-sm font-medium text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-400/15"
          >
            Payment Proof Review
          </Link>
          <Link
            href="/admin/customs"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            Customs Control
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Payment Requests"
            value={String(metrics.total)}
            detail="All active records"
          />

          <MetricCard
            label="Pending"
            value={String(
              metrics.pending,
            )}
            detail="Awaiting settlement"
          />

          <MetricCard
            label="Paid"
            value={String(
              metrics.paid,
            )}
            detail="Successfully recorded"
          />

          <MetricCard
            label="Exceptions"
            value={String(
              metrics.exceptions,
            )}
            detail="Failed or expired"
          />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <ExposureCard
            label="Outstanding Exposure"
            value={metrics.outstanding}
            payments={payments}
          />

          <MetricCard
            label="Processing"
            value={String(
              metrics.processing,
            )}
            detail="Currently processing"
          />

          <MetricCard
            label="Settled Requests"
            value={String(
              metrics.paid,
            )}
            detail="Payment requests completed"
          />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] shadow-2xl shadow-black/20">
          <div className="border-b border-white/[0.07] p-5 lg:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Payment Requests
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {filteredPayments.length} visible
                  records
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search reference, shipment, customs..."
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 sm:w-80"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | "all"
                        | PaymentStatus,
                    )
                  }
                  className="h-10 rounded-xl border border-white/10 bg-[#0b0e13] px-3 text-sm text-zinc-300 outline-none focus:border-white/20"
                >
                  <option value="all">
                    All statuses
                  </option>
                  <option value="pending">
                    Pending
                  </option>
                  <option value="processing">
                    Processing
                  </option>
                  <option value="paid">
                    Paid
                  </option>
                  <option value="failed">
                    Failed
                  </option>
                  <option value="cancelled">
                    Cancelled
                  </option>
                  <option value="expired">
                    Expired
                  </option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-sm text-zinc-500">
                Loading payment operations...
              </div>
            </div>
          ) : error ? (
            <div className="m-6 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-5">
              <p className="text-sm font-medium text-red-300">
                Unable to load payments
              </p>

              <p className="mt-1 text-sm text-red-200/60">
                {error}
              </p>
            </div>
          ) : filteredPayments.length ===
            0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-500">
                $
              </div>

              <h3 className="text-sm font-semibold text-zinc-200">
                No payment requests found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Payment requests created from
                customs operations will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                    <th className="px-6 py-4 font-medium">
                      Reference
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Customs
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Amount
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Provider
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Due
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Updated
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.05]">
                  {filteredPayments.map(
                    (payment) => (
                      <tr
                        key={payment.id}
                        className="group transition hover:bg-white/[0.025]"
                      >
                        <td className="px-6 py-5">
                          <Link
                            href={`/admin/payments/${encodeURIComponent(
                              payment.id,
                            )}`}
                            className="block"
                          >
                            <div className="font-mono text-sm font-medium text-zinc-200 transition group-hover:text-white">
                              {payment.reference}
                            </div>

                            <div className="mt-1 max-w-xs truncate text-xs text-zinc-600">
                              {payment.description}
                            </div>
                          </Link>
                        </td>

                        <td className="px-6 py-5">
                          {payment.customs_case ? (
                            <Link
                              href={`/admin/customs/${encodeURIComponent(
                                payment.customs_case.shipment_id,
                              )}`}
                              className="block"
                            >
                              <div className="font-mono text-xs text-zinc-300 transition hover:text-white">
                                {payment.customs_case
                                  .customs_reference ??
                                  "No reference"}
                              </div>

                              <div className="mt-1 font-mono text-[11px] text-zinc-600">
                                {payment.customs_case
                                  .shipment_id
                                  .slice(0, 8)}
                                ...
                              </div>
                            </Link>
                          ) : (
                            <span className="text-xs text-zinc-600">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="font-medium text-zinc-200">
                            {formatMoney(
                              payment.amount,
                              payment.currency,
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm text-zinc-400">
                            {
                              providerLabels[
                                payment.provider
                              ]
                            }
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-xs text-zinc-500">
                            {formatDate(
                              payment.due_at,
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                              payment.status,
                            )}`}
                          >
                            {
                              statusLabels[
                                payment.status
                              ]
                            }
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-xs text-zinc-600">
                            {formatDate(
                              payment.updated_at,
                            )}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </div>

      <div className="mt-1 text-xs text-zinc-600">
        {detail}
      </div>
    </div>
  );
}

function ExposureCard({
  label,
  value,
  payments,
}: {
  label: string;
  value: number;
  payments: PaymentRequest[];
}) {
  const currencies = Array.from(
    new Set(
      payments
        .filter(
          (payment) =>
            payment.status ===
              "pending" ||
            payment.status ===
              "processing",
        )
        .map(
          (payment) =>
            payment.currency,
        ),
    ),
  );

  return (
    <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.025] p-5 lg:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-200/40">
            {label}
          </div>

          <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {currencies.length === 1
              ? formatMoney(
                  value,
                  currencies[0],
                )
              : currencies.length > 1
                ? "Multi-currency"
                : "0.00"}
          </div>

          <div className="mt-1 text-xs text-zinc-600">
            Pending and processing payment
            requests
          </div>
        </div>

        <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.05] px-3 py-2 text-xs text-amber-200/60">
          Financial exposure
        </div>
      </div>
    </div>
  );
}