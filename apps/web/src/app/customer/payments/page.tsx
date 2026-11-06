"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PaymentProof = {
  id: string;
  payment_request_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  rejection_reason?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
};

type PaymentRequest = {
  id: string;
  customs_case_id: string;
  reference: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  provider?: string | null;
  due_at?: string | null;
  created_at: string;
  updated_at: string;
  bank_name_snapshot?: string | null;
  account_name_snapshot?: string | null;
  account_number_snapshot?: string | null;
  bank_currency_snapshot?: string | null;
  transfer_instructions_snapshot?: string | null;
  proofs: PaymentProof[];
};

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatDate(value?: string | null) {
  if (!value) return "Not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(amount: number, currency: string) {
  const value = Number(amount);

  if (!Number.isFinite(value)) return `${currency} —`;

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en")}`;
  }
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
    case "failed":
    case "cancelled":
    case "expired":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "submitted":
    case "processing":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function displayStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

function extractPayments(payload: unknown): PaymentRequest[] {
  if (Array.isArray(payload)) return payload as PaymentRequest[];

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;

    if (Array.isArray(data.payments)) {
      return data.payments as PaymentRequest[];
    }

    if (Array.isArray(data.items)) {
      return data.items as PaymentRequest[];
    }
  }

  return [];
}

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/customer/payments", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (response.status === 401) {
        window.location.assign("/customer/login");
        return;
      }

      const payload: unknown = await response.json();

      if (!response.ok) {
        const detail =
          payload &&
          typeof payload === "object" &&
          "detail" in payload &&
          typeof payload.detail === "string"
            ? payload.detail
            : "We could not load your payment requests.";

        throw new Error(detail);
      }

      setPayments(extractPayments(payload));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the payment service."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  async function handleProofUpload(
    paymentRequestId: string,
    file?: File
  ) {
    setSuccessMessage("");
    setUploadError("");

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Choose a PDF, JPEG, PNG, or WebP file.");
      return;
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      setUploadError("The file must be larger than 0 bytes and no more than 10 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingId(paymentRequestId);

    try {
      const response = await fetch(
        `/api/customer/payments/${encodeURIComponent(paymentRequestId)}/proofs`,
        {
          method: "POST",
          body: formData,
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.assign("/customer/login");
        return;
      }

      const payload: unknown = await response.json();

      if (!response.ok) {
        const detail =
          payload &&
          typeof payload === "object" &&
          "detail" in payload &&
          typeof payload.detail === "string"
            ? payload.detail
            : "Your proof could not be uploaded.";

        throw new Error(detail);
      }

      setSuccessMessage(
        "Your proof of payment has been submitted. Your payment will remain pending until an administrator reviews and approves it."
      );

      await loadPayments();
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "The upload failed. Please try again."
      );
    } finally {
      setUploadingId(null);
    }
  }

  const outstandingCount = payments.filter((payment) =>
    ["pending", "processing"].includes(payment.status.toLowerCase())
  ).length;

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/customer" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14243d] text-sm font-bold text-white">
              GL
            </span>
            <span>
              <span className="block text-sm font-bold tracking-wide text-[#14243d]">
                GLOBAL LOGISTICS
              </span>
              <span className="block text-xs text-slate-500">
                Customer portal
              </span>
            </span>
          </Link>

          <Link
            href="/customer"
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
            Customer finance
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#14243d] sm:text-4xl">
            Payment requests
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Review your payment instructions, transfer funds to the assigned
            bank account, and securely submit your proof of payment.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total requests</p>
            <p className="mt-2 text-3xl font-bold text-[#14243d]">
              {loading ? "—" : payments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Awaiting payment</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {loading ? "—" : outstandingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Payments completed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {loading
                ? "—"
                : payments.filter(
                    (payment) => payment.status.toLowerCase() === "paid"
                  ).length}
            </p>
          </div>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
          >
            {successMessage}
          </div>
        )}

        {uploadError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {uploadError}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-white p-6">
            <p className="font-semibold text-rose-700">
              Unable to load payment requests
            </p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadPayments()}
              className="mt-4 rounded-lg bg-[#14243d] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading your payment requests...
          </div>
        )}

        {!loading && !error && payments.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              ₦
            </div>
            <h2 className="mt-5 text-lg font-bold text-[#14243d]">
              No payment requests yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              When a payment request is created for one of your shipments, it
              will appear here with its payment instructions.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          payments.map((payment) => {
            const status = payment.status.toLowerCase();
            const proofs = Array.isArray(payment.proofs)
              ? payment.proofs
              : [];

            const hasSubmittedProof = proofs.some(
              (proof) => proof.status.toLowerCase() === "submitted"
            );

            const latestRejectedProof = [...proofs]
              .filter((proof) => proof.status.toLowerCase() === "rejected")
              .sort(
                (a, b) =>
                  new Date(b.submitted_at).getTime() -
                  new Date(a.submitted_at).getTime()
              )[0];

            const canUpload =
              ["pending", "processing"].includes(status) &&
              !hasSubmittedProof;

            return (
              <section
                key={payment.id}
                className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Payment reference
                    </p>
                    <h2 className="mt-1 break-all text-lg font-bold text-[#14243d]">
                      {payment.reference}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {payment.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyle(status)}`}
                    >
                      {displayStatus(status)}
                    </span>
                    <p className="text-xl font-bold text-[#14243d]">
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#14243d]">
                      Bank transfer details
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Use the account details assigned to this payment request.
                    </p>

                    <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {[
                        ["Bank name", payment.bank_name_snapshot],
                        ["Account name", payment.account_name_snapshot],
                        ["Account number", payment.account_number_snapshot],
                        ["Currency", payment.bank_currency_snapshot],
                        ["Payment reference", payment.reference],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="text-xs text-slate-500">
                            {label}
                          </span>
                          <span className="break-all text-sm font-semibold text-slate-800 sm:text-right">
                            {value || "Not provided"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {payment.transfer_instructions_snapshot && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Transfer instructions
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {payment.transfer_instructions_snapshot}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 space-y-2 text-xs text-slate-500">
                      <p>Due date: {formatDate(payment.due_at)}</p>
                      <p>Request created: {formatDate(payment.created_at)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#14243d]">
                      Proof of payment
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Upload your bank transfer receipt as a PDF or image.
                      Maximum file size: 10 MB.
                    </p>

                    {hasSubmittedProof && (
                      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                        Your proof has been submitted and is awaiting
                        administrator review. You cannot submit another proof
                        until it has been reviewed.
                      </div>
                    )}

                    {latestRejectedProof?.rejection_reason && (
                      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
                          Previous submission rejected
                        </p>
                        <p className="mt-2 text-sm leading-6 text-rose-800">
                          {latestRejectedProof.rejection_reason}
                        </p>
                      </div>
                    )}

                    {canUpload && (
                      <label className="mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50">
                        <span className="text-2xl text-slate-400">↑</span>
                        <span className="mt-2 text-sm font-bold text-[#14243d]">
                          {uploadingId === payment.id
                            ? "Uploading proof..."
                            : "Choose proof of payment"}
                        </span>
                        <span className="mt-1 text-xs text-slate-500">
                          PDF, JPEG, PNG or WebP · Up to 10 MB
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                          className="sr-only"
                          disabled={uploadingId !== null}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            void handleProofUpload(payment.id, file);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    )}

                    {!canUpload && status === "paid" && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        This payment has been approved and marked as paid.
                      </div>
                    )}

                    {!canUpload &&
                      !hasSubmittedProof &&
                      !latestRejectedProof &&
                      !["paid", "pending", "processing"].includes(status) && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          Proof upload is unavailable for this payment request.
                        </div>
                      )}

                    <div className="mt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Submission history
                      </h4>

                      {proofs.length === 0 ? (
                        <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                          No proof of payment has been submitted.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {proofs.map((proof) => (
                            <div
                              key={proof.id}
                              className="rounded-xl border border-slate-200 p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="break-all text-sm font-semibold text-slate-800">
                                  {proof.original_filename}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle(proof.status)}`}
                                >
                                  {displayStatus(proof.status)}
                                </span>
                              </div>
                              <p className="mt-2 text-xs text-slate-500">
                                Submitted: {formatDate(proof.submitted_at)}
                              </p>
                              {proof.reviewed_at && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Reviewed: {formatDate(proof.reviewed_at)}
                                </p>
                              )}
                              {proof.rejection_reason && (
                                <p className="mt-3 text-sm leading-6 text-rose-700">
                                  Reason: {proof.rejection_reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-500">
          <strong className="text-slate-700">Payment security:</strong> Uploading
          a receipt does not automatically complete a payment. Your payment
          remains pending until the Global Logistics administration team
          verifies and approves your proof.
        </div>
      </div>
    </main>
  );
}
