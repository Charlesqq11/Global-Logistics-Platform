"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ProofStatus = "submitted" | "approved" | "rejected";
type Filter = "all" | ProofStatus;

type PaymentProof = {
  id: string;
  payment_request_id: string;
  payment_reference: string;
  amount: number | string;
  currency: string;
  payment_status: string;
  customs_case_id: string;
  shipment_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  status: ProofStatus;
  rejection_reason: string | null;
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
};

const filters: { label: string; value: Filter }[] = [
  { label: "All proofs", value: "all" },
  { label: "Awaiting review", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function money(amount: number | string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${currency} —`;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

function date(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function fileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size";
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

function statusStyle(status: string) {
  if (status === "approved") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }
  if (status === "rejected") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  }
  return "border-amber-400/20 bg-amber-400/10 text-amber-200";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusStyle(status)}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function AdminPaymentProofsPage() {
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [filter, setFilter] = useState<Filter>("submitted");
  const [selected, setSelected] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const loadProofs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/payment-proofs", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/admin/login";
        return;
      }

      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(payload?.detail || "Unable to load payment proofs.");
      }

      const records: PaymentProof[] = Array.isArray(payload) ? payload : [];
      setProofs(records);
      setSelected((current) =>
        current ? records.find((item) => item.id === current.id) ?? null : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payment proofs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProofs();
  }, [loadProofs]);

  const visibleProofs = useMemo(() => {
    if (filter === "all") return proofs;
    return proofs.filter((proof) => proof.status === filter);
  }, [proofs, filter]);

  const submittedCount = proofs.filter((proof) => proof.status === "submitted").length;
  const approvedCount = proofs.filter((proof) => proof.status === "approved").length;
  const rejectedCount = proofs.filter((proof) => proof.status === "rejected").length;

  function openProof(proof: PaymentProof) {
    setSelected(proof);
    setDecision(null);
    setTransactionId("");
    setRejectionReason(proof.rejection_reason ?? "");
    setAdminNotes(proof.admin_notes ?? "");
    setNotice("");
    setError("");
  }

  async function submitDecision() {
    if (!selected || !decision) return;

    if (decision === "reject" && !rejectionReason.trim()) {
      setError("Enter a rejection reason before rejecting this proof.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    const endpoint = `/api/admin/payment-proofs/${encodeURIComponent(selected.id)}/${decision}`;

    const body = decision === "approve"
      ? {
          provider_transaction_id: transactionId.trim() || null,
          admin_notes: adminNotes.trim() || null,
        }
      : {
          rejection_reason: rejectionReason.trim(),
          admin_notes: adminNotes.trim() || null,
        };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.detail || `Unable to ${decision} this proof.`);
      }

      setNotice(
        decision === "approve"
          ? "Proof approved. The payment has been recorded."
          : "Proof rejected. The customer can submit a corrected receipt."
      );

      setDecision(null);
      await loadProofs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The review action failed.");
    } finally {
      setBusy(false);
    }
  }

  const previewUrl = selected
    ? `/api/admin/payment-proofs/${encodeURIComponent(selected.id)}/preview`
    : "";

  const downloadUrl = selected
    ? `/api/admin/payment-proofs/${encodeURIComponent(selected.id)}/download`
    : "";

  const canPreview = Boolean(selected && [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ].includes(selected.mime_type.toLowerCase()));

  const isImage = selected?.mime_type.toLowerCase().startsWith("image/");

  return (
    <main className="min-h-screen bg-[#07090d] text-zinc-100">
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">

        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
              <Link href="/admin" className="transition hover:text-zinc-300">Administration</Link>
              <span>/</span>
              <Link href="/admin/payments" className="transition hover:text-zinc-300">Payments</Link>
              <span>/</span>
              <span className="text-amber-200/70">Proof review</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Payment proof review
              </h1>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">
                Financial operations
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Verify customer transfer receipts, review payment evidence and record payment decisions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/payments" className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04]">
              Payment requests
            </Link>
            <button onClick={() => void loadProofs()} disabled={loading} className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50">
              {loading ? "Refreshing..." : "Refresh queue"}
            </button>
          </div>
        </header>

        {notice && (
          <div role="status" className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        {error && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-xs text-rose-100 underline">Dismiss</button>
          </div>
        )}

        <section className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total receipts" value={proofs.length.toString()} detail="All submitted proof records" />
          <Metric label="Awaiting review" value={submittedCount.toString()} detail="Require an administrator decision" accent="amber" />
          <Metric label="Approved" value={approvedCount.toString()} detail="Payment evidence accepted" accent="green" />
          <Metric label="Rejected" value={rejectedCount.toString()} detail="Customer correction may be required" accent="red" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">

          <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1016]">
            <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-semibold text-white">Receipt queue</h2>
                <p className="mt-1 text-xs text-zinc-600">Select a receipt to inspect its evidence.</p>
              </div>
              <span className="text-xs text-zinc-500">{visibleProofs.length} records</span>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-white/[0.06] px-5 py-4">
              {filters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`rounded-lg px-3 py-2 text-[11px] font-medium transition ${filter === item.value ? "bg-white text-black" : "border border-white/[0.08] text-zinc-500 hover:text-white"}`}
                >
                  {item.label}
                  {item.value === "submitted" && submittedCount > 0 ? ` · ${submittedCount}` : ""}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-xl bg-white/[0.035]" />
                ))}
              </div>
            ) : visibleProofs.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-xl text-zinc-500">✓</div>
                <p className="text-sm font-medium text-zinc-300">Nothing in this queue</p>
                <p className="mt-2 text-xs text-zinc-600">There are no payment proofs matching this filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {visibleProofs.map((proof) => (
                  <button
                    key={proof.id}
                    onClick={() => openProof(proof)}
                    className={`w-full p-5 text-left transition hover:bg-white/[0.025] ${selected?.id === proof.id ? "bg-white/[0.045] ring-1 ring-inset ring-amber-300/20" : ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-semibold text-zinc-200">{proof.payment_reference}</div>
                        <div className="mt-1 max-w-[300px] truncate text-xs text-zinc-500">{proof.original_filename}</div>
                      </div>
                      <StatusBadge status={proof.status} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.13em] text-zinc-600">Payment amount</div>
                        <div className="mt-1 text-sm font-semibold text-white">{money(proof.amount, proof.currency)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-[0.13em] text-zinc-600">Submitted</div>
                        <div className="mt-1 text-xs text-zinc-400">{date(proof.submitted_at)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1016]">
            {!selected ? (
              <div className="flex min-h-[560px] flex-col items-center justify-center px-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-2xl text-zinc-500">▧</div>
                <h2 className="text-sm font-semibold text-zinc-200">Receipt inspection</h2>
                <p className="mt-2 max-w-xs text-xs leading-6 text-zinc-600">
                  Choose a receipt from the queue to inspect the original evidence and review its payment details.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-5">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-600">Selected receipt</div>
                    <h2 className="mt-1 max-w-[280px] truncate text-sm font-semibold text-white">{selected.payment_reference}</h2>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="border-b border-white/[0.06] bg-[#080b10] p-3">
                  <div className="flex items-center justify-between gap-3 px-2 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-zinc-300">{selected.original_filename}</div>
                      <div className="mt-1 text-[10px] text-zinc-600">{selected.mime_type} · {fileSize(selected.size_bytes)}</div>
                    </div>
                    <a href={downloadUrl} className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:bg-white/[0.06]">
                      Download original ↓
                    </a>
                  </div>

                  <div className="mt-2 flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.07] bg-[#05070a] p-2 sm:min-h-[360px]">
                    {!canPreview ? (
                      <div className="px-5 text-center text-xs leading-6 text-zinc-500">
                        Preview is unavailable for this file type. Download the original file to inspect it.
                      </div>
                    ) : isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt={`Payment receipt ${selected.original_filename}`} className="max-h-[520px] max-w-full object-contain" />
                    ) : (
                      <iframe title={`Payment receipt ${selected.original_filename}`} src={previewUrl} className="h-[420px] w-full rounded-lg bg-white sm:h-[520px]" />
                    )}
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div>
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Payment information</div>
                    <div className="grid grid-cols-2 gap-4">
                      <Detail label="Amount" value={money(selected.amount, selected.currency)} />
                      <Detail label="Payment status" value={selected.payment_status} />
                      <Detail label="Customs case" value={selected.customs_case_id.slice(0, 12) + "…"} mono />
                      <Detail label="Shipment" value={selected.shipment_id.slice(0, 12) + "…"} mono />
                      <Detail label="Submitted" value={date(selected.submitted_at)} />
                      <Detail label="Reviewed" value={date(selected.reviewed_at)} />
                    </div>
                  </div>

                  {selected.rejection_reason && (
                    <div className="rounded-xl border border-rose-400/15 bg-rose-400/[0.05] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-300">Rejection reason</div>
                      <p className="mt-2 text-xs leading-5 text-rose-100/80">{selected.rejection_reason}</p>
                    </div>
                  )}

                  {selected.admin_notes && (
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Administrator notes</div>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-300">{selected.admin_notes}</p>
                    </div>
                  )}

                  {selected.status === "submitted" ? (
                    <div className="border-t border-white/[0.06] pt-5">
                      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Review decision</div>

                      {!decision ? (
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => setDecision("approve")} className="rounded-xl bg-emerald-400 px-4 py-3 text-xs font-bold text-[#07110c] transition hover:bg-emerald-300">
                            Approve payment
                          </button>
                          <button onClick={() => setDecision("reject")} className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/10">
                            Reject receipt
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-white">
                              {decision === "approve" ? "Approve this payment" : "Reject this receipt"}
                            </div>
                            <button onClick={() => setDecision(null)} disabled={busy} className="text-xs text-zinc-500 hover:text-white">
                              Cancel
                            </button>
                          </div>

                          {decision === "approve" ? (
                            <label className="block text-xs text-zinc-400">
                              Provider transaction ID <span className="text-zinc-600">(optional)</span>
                              <input
                                value={transactionId}
                                onChange={(event) => setTransactionId(event.target.value)}
                                maxLength={255}
                                placeholder="Enter verified bank transaction reference"
                                className="mt-2 w-full rounded-lg border border-white/10 bg-[#080b10] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-emerald-400/40"
                              />
                            </label>
                          ) : (
                            <label className="block text-xs text-zinc-400">
                              Rejection reason <span className="text-rose-300">*</span>
                              <textarea
                                value={rejectionReason}
                                onChange={(event) => setRejectionReason(event.target.value)}
                                maxLength={2000}
                                rows={3}
                                placeholder="Explain what the customer needs to correct..."
                                className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#080b10] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-rose-400/40"
                              />
                            </label>
                          )}

                          <label className="block text-xs text-zinc-400">
                            Internal admin notes <span className="text-zinc-600">(optional)</span>
                            <textarea
                              value={adminNotes}
                              onChange={(event) => setAdminNotes(event.target.value)}
                              maxLength={2000}
                              rows={2}
                              placeholder="Internal review notes..."
                              className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#080b10] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/20"
                            />
                          </label>

                          <button
                            onClick={() => void submitDecision()}
                            disabled={busy || (decision === "reject" && !rejectionReason.trim())}
                            className={`w-full rounded-lg px-4 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${decision === "approve" ? "bg-emerald-400 text-[#07110c] hover:bg-emerald-300" : "bg-rose-400 text-[#190709] hover:bg-rose-300"}`}
                          >
                            {busy ? "Recording decision..." : decision === "approve" ? "Confirm approval and record payment" : "Confirm receipt rejection"}
                          </button>

                          {decision === "approve" && (
                            <p className="text-[10px] leading-5 text-amber-200/60">
                              Only approve after independently verifying that the funds have arrived in the designated account. Approval records the payment and may trigger customs clearance.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-xs leading-5 text-zinc-500">
                      This proof has already been reviewed. Its decision is retained in the payment record.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <footer className="mt-8 border-t border-white/[0.06] pt-5 text-[10px] leading-5 text-zinc-700">
          Restricted financial operations · Receipt files are served through authenticated administrator routes · Customer uploads do not constitute payment confirmation.
        </footer>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  detail,
  accent = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "neutral" | "amber" | "green" | "red";
}) {
  const valueColor =
    accent === "amber" ? "text-amber-200" :
    accent === "green" ? "text-emerald-300" :
    accent === "red" ? "text-rose-300" :
    "text-white";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1016] p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-600">{label}</div>
      <div className={`mt-3 text-3xl font-semibold tracking-tight ${valueColor}`}>{value}</div>
      <div className="mt-1 text-xs text-zinc-600">{detail}</div>
    </div>
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
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">{label}</div>
      <div className={`mt-1 break-words text-xs text-zinc-300 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
