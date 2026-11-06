"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

type Payment = {
  id: string;
  payment_request_id: string;
  provider: PaymentProvider;
  provider_transaction_id?: string | null;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
};

type CustomsCase = {
  id: string;
  shipment_id: string;
  status?: string | null;
  customs_reference?: string | null;
  hold_reason?: string | null;
  required_action?: string | null;
  authority_name?: string | null;
  opened_at?: string | null;
  cleared_at?: string | null;
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
  payments?: Payment[];
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

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      },
    ).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
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

export default function PaymentRequestDetailPage() {
  const params = useParams();
  const router = useRouter();

  const paymentRequestId =
    typeof params.paymentRequestId ===
    "string"
      ? params.paymentRequestId
      : "";

  const [paymentRequest, setPaymentRequest] =
    useState<PaymentRequest | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [transactionId, setTransactionId] =
    useState("");

  const [processingAction, setProcessingAction] =
    useState<
      "paid" | "cancel" | null
    >(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [actionSuccess, setActionSuccess] =
    useState<string | null>(null);

  const [showPaidConfirmation, setShowPaidConfirmation] =
    useState(false);

  const [showCancelConfirmation, setShowCancelConfirmation] =
    useState(false);

  const loadPayment = useCallback(
    async () => {
      if (!paymentRequestId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/admin/payments/${encodeURIComponent(
            paymentRequestId,
          )}`,
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
              "Unable to load payment request.",
          );
        }

        setPaymentRequest(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load payment request.",
        );
      } finally {
        setLoading(false);
      }
    },
    [paymentRequestId],
  );

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  const canMarkPaid = useMemo(
    () =>
      paymentRequest?.status ===
        "pending" ||
      paymentRequest?.status ===
        "processing",
    [paymentRequest],
  );

  const canCancel = useMemo(
    () =>
      paymentRequest?.status ===
        "pending" ||
      paymentRequest?.status ===
        "processing",
    [paymentRequest],
  );

  async function markPaid() {
    if (!paymentRequest) {
      return;
    }

    try {
      setProcessingAction("paid");
      setActionError(null);
      setActionSuccess(null);

      const response = await fetch(
        `/api/admin/payments/${encodeURIComponent(
          paymentRequest.id,
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            provider_transaction_id:
              transactionId.trim() ||
              null,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to mark payment as paid.",
        );
      }

      setShowPaidConfirmation(false);
      setActionSuccess(
        "Payment recorded successfully. Customs status has been synchronized.",
      );

      setTransactionId("");

      await loadPayment();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to mark payment as paid.",
      );
    } finally {
      setProcessingAction(null);
    }
  }

  async function cancelPayment() {
    if (!paymentRequest) {
      return;
    }

    try {
      setProcessingAction("cancel");
      setActionError(null);
      setActionSuccess(null);

      const response = await fetch(
        `/api/admin/payments/${encodeURIComponent(
          paymentRequest.id,
        )}`,
        {
          method: "DELETE",
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to cancel payment request.",
        );
      }

      setShowCancelConfirmation(false);
      setActionSuccess(
        "Payment request cancelled successfully.",
      );

      await loadPayment();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to cancel payment request.",
      );
    } finally {
      setProcessingAction(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07090d] text-white">
        <div className="mx-auto flex min-h-screen max-w-[1500px] items-center justify-center px-6">
          <div className="text-sm text-zinc-500">
            Loading payment request...
          </div>
        </div>
      </main>
    );
  }

  if (error || !paymentRequest) {
    return (
      <main className="min-h-screen bg-[#07090d] text-white">
        <div className="mx-auto max-w-[1500px] px-6 py-10 lg:px-10">
          <Link
            href="/admin/payments"
            className="text-sm text-zinc-500 transition hover:text-white"
          >
            ← Back to Payments
          </Link>

          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-6">
            <h1 className="text-lg font-semibold text-red-300">
              Payment request unavailable
            </h1>

            <p className="mt-2 text-sm text-red-200/60">
              {error ??
                "The requested payment request could not be found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const customsCase =
    paymentRequest.customs_case;

  const shipmentId =
    customsCase?.shipment_id;

  const paymentHistory =
    paymentRequest.payments ?? [];

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-600">
              <Link
                href="/admin"
                className="transition hover:text-white"
              >
                Operations
              </Link>

              <span>/</span>

              <Link
                href="/admin/payments"
                className="transition hover:text-white"
              >
                Payments
              </Link>

              <span>/</span>

              <span className="text-zinc-300">
                {paymentRequest.reference}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold tracking-tight lg:text-3xl">
                {paymentRequest.reference}
              </h1>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                  paymentRequest.status,
                )}`}
              >
                {
                  statusLabels[
                    paymentRequest.status
                  ]
                }
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Payment request associated with a
              customs operation.
            </p>
          </div>

          <div className="flex gap-3">
            {shipmentId && (
              <Link
                href={`/admin/shipments/${encodeURIComponent(
                  shipmentId,
                )}`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                Shipment Record
              </Link>
            )}

            {customsCase && (
              <Link
                href={`/admin/customs/${encodeURIComponent(
                  customsCase.shipment_id,
                )}`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                Customs Case
              </Link>
            )}
          </div>
        </div>

        {actionSuccess && (
          <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-300">
            {actionSuccess}
          </div>
        )}

        {actionError && (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
            {actionError}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-4">
          <SummaryCard
            label="Amount"
            value={formatMoney(
              paymentRequest.amount,
              paymentRequest.currency,
            )}
          />

          <SummaryCard
            label="Provider"
            value={
              providerLabels[
                paymentRequest.provider
              ]
            }
          />

          <SummaryCard
            label="Due Date"
            value={formatDate(
              paymentRequest.due_at,
            )}
          />

          <SummaryCard
            label="Created"
            value={formatDate(
              paymentRequest.created_at,
            )}
          />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
              <SectionTitle>
                Payment Request
              </SectionTitle>

              <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <Detail
                  label="Reference"
                  value={
                    paymentRequest.reference
                  }
                  mono
                />

                <Detail
                  label="Status"
                  value={
                    statusLabels[
                      paymentRequest.status
                    ]
                  }
                />

                <Detail
                  label="Provider"
                  value={
                    providerLabels[
                      paymentRequest.provider
                    ]
                  }
                />

                <Detail
                  label="Currency"
                  value={
                    paymentRequest.currency
                  }
                />

                <Detail
                  label="Created"
                  value={formatDate(
                    paymentRequest.created_at,
                  )}
                />

                <Detail
                  label="Last Updated"
                  value={formatDate(
                    paymentRequest.updated_at,
                  )}
                />

                <div className="sm:col-span-2">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
                    Description
                  </div>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                    {
                      paymentRequest.description
                    }
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
              <SectionTitle>
                Customs Context
              </SectionTitle>

              {customsCase ? (
                <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  <Detail
                    label="Customs Reference"
                    value={
                      customsCase.customs_reference ??
                      "Not assigned"
                    }
                    mono
                  />

                  <Detail
                    label="Customs Status"
                    value={
                      customsCase.status ??
                      "Unknown"
                    }
                  />

                  <Detail
                    label="Authority"
                    value={
                      customsCase.authority_name ??
                      "Not specified"
                    }
                  />

                  <Detail
                    label="Shipment ID"
                    value={
                      customsCase.shipment_id
                    }
                    mono
                  />

                  {customsCase.hold_reason && (
                    <div className="sm:col-span-2 rounded-xl border border-amber-400/10 bg-amber-400/[0.035] p-4">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-200/40">
                        Hold Reason
                      </div>

                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {
                          customsCase.hold_reason
                        }
                      </p>
                    </div>
                  )}

                  {customsCase.required_action && (
                    <div className="sm:col-span-2 rounded-xl border border-blue-400/10 bg-blue-400/[0.035] p-4">
                      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-blue-200/40">
                        Required Action
                      </div>

                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {
                          customsCase.required_action
                        }
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-5 text-sm text-zinc-600">
                  No customs case information is
                  attached to this payment request.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
              <SectionTitle>
                Payment History
              </SectionTitle>

              {paymentHistory.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-6 text-center">
                  <p className="text-sm text-zinc-600">
                    No payment transaction has been
                    recorded yet.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {paymentHistory.map(
                    (payment) => (
                      <div
                        key={payment.id}
                        className="rounded-xl border border-white/[0.07] bg-black/10 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-zinc-300">
                                {payment.id.slice(
                                  0,
                                  8,
                                )}
                                ...
                              </span>

                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(
                                  payment.status,
                                )}`}
                              >
                                {
                                  statusLabels[
                                    payment.status
                                  ]
                                }
                              </span>
                            </div>

                            <div className="mt-2 text-xs text-zinc-600">
                              {payment.provider_transaction_id
                                ? `Transaction: ${payment.provider_transaction_id}`
                                : "No provider transaction ID"}
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <div className="font-medium text-zinc-200">
                              {formatMoney(
                                payment.amount,
                                payment.currency,
                              )}
                            </div>

                            <div className="mt-1 text-xs text-zinc-600">
                              {formatDate(
                                payment.paid_at ??
                                  payment.created_at,
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            {(canMarkPaid ||
              canCancel) && (
              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <SectionTitle>
                  Payment Actions
                </SectionTitle>

                {canMarkPaid && (
                  <div className="mt-5">
                    <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
                      Provider Transaction ID
                    </label>

                    <input
                      value={transactionId}
                      onChange={(event) =>
                        setTransactionId(
                          event.target.value,
                        )
                      }
                      placeholder="Optional transaction reference"
                      className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/20"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPaidConfirmation(
                          true,
                        )
                      }
                      disabled={
                        processingAction !== null
                      }
                      className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingAction ===
                      "paid"
                        ? "Recording Payment..."
                        : "Mark as Paid"}
                    </button>

                    <p className="mt-3 text-xs leading-5 text-zinc-600">
                      This records the payment and
                      triggers the customs clearance
                      workflow when all outstanding
                      payment requirements are settled.
                    </p>
                  </div>
                )}

                {canCancel && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowCancelConfirmation(
                        true,
                      )
                    }
                    disabled={
                      processingAction !== null
                    }
                    className="mt-4 flex h-10 w-full items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.04] px-4 text-sm font-medium text-red-300 transition hover:bg-red-400/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processingAction ===
                    "cancel"
                      ? "Cancelling..."
                      : "Cancel Payment Request"}
                  </button>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <SectionTitle>
                Record Metadata
              </SectionTitle>

              <div className="mt-5 space-y-4">
                <Detail
                  label="Payment ID"
                  value={
                    paymentRequest.id
                  }
                  mono
                />

                <Detail
                  label="Customs Case ID"
                  value={
                    paymentRequest.customs_case_id
                  }
                  mono
                />

                <Detail
                  label="Last Updated"
                  value={formatDate(
                    paymentRequest.updated_at,
                  )}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showPaidConfirmation && (
        <ConfirmationModal
          title="Record payment as paid?"
          description={`This will record ${formatMoney(
            paymentRequest.amount,
            paymentRequest.currency,
          )} as paid for ${paymentRequest.reference}.`}
          confirmLabel="Confirm Payment"
          busy={
            processingAction ===
            "paid"
          }
          onCancel={() =>
            setShowPaidConfirmation(
              false,
            )
          }
          onConfirm={markPaid}
        />
      )}

      {showCancelConfirmation && (
        <ConfirmationModal
          title="Cancel payment request?"
          description={`The payment request ${paymentRequest.reference} will be marked as cancelled and can no longer be paid.`}
          confirmLabel="Cancel Request"
          destructive
          busy={
            processingAction ===
            "cancel"
          }
          onCancel={() =>
            setShowCancelConfirmation(
              false,
            )
          }
          onConfirm={cancelPayment}
        />
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </div>

      <div className="mt-3 truncate text-xl font-semibold tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 className="text-sm font-semibold text-white">
      {children}
    </h2>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </div>

      <div
        className={`mt-2 break-all text-sm text-zinc-300 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ConfirmationModal({
  title,
  description,
  confirmLabel,
  destructive = false,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1016] p-6 shadow-2xl shadow-black/50">
        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {description}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.07] disabled:opacity-50"
          >
            Go Back
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-10 flex-1 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50 ${
              destructive
                ? "bg-red-400 text-black hover:bg-red-300"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {busy
              ? "Processing..."
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}