"use client";

import { FormEvent, useState } from "react";

type CreateCustomsCaseModalProps = {
  shipmentId: string;
  tracking: string;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateCustomsCaseModal({
  shipmentId,
  tracking,
  onClose,
  onCreated,
}: CreateCustomsCaseModalProps) {
  const [customsReference, setCustomsReference] =
    useState("");

  const [authorityName, setAuthorityName] =
    useState("");

  const [requiredAction, setRequiredAction] =
    useState("");

  const [internalNotes, setInternalNotes] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/customs/${encodeURIComponent(
          shipmentId,
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            customs_reference:
              customsReference.trim() || null,

            authority_name:
              authorityName.trim() || null,

            required_action:
              requiredAction.trim() || null,

            internal_notes:
              internalNotes.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to create the customs case.",
        );
      }

      onCreated();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the customs case.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f17] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/60">
                Customs Control
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                Create Customs Case
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Open a customs control record for{" "}
                <span className="font-medium text-slate-200">
                  {tracking}
                </span>
                .
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
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="customs-reference"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
              >
                Customs Reference
              </label>

              <input
                id="customs-reference"
                value={customsReference}
                onChange={(event) =>
                  setCustomsReference(
                    event.target.value,
                  )
                }
                maxLength={100}
                placeholder="CUS-TEST-001"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/25 focus:bg-white/[0.06]"
              />
            </div>

            <div>
              <label
                htmlFor="authority-name"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
              >
                Authority
              </label>

              <input
                id="authority-name"
                value={authorityName}
                onChange={(event) =>
                  setAuthorityName(
                    event.target.value,
                  )
                }
                placeholder="Customs Authority"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/25 focus:bg-white/[0.06]"
              />
            </div>

            <div>
              <label
                htmlFor="required-action"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
              >
                Required Action
              </label>

              <textarea
                id="required-action"
                value={requiredAction}
                onChange={(event) =>
                  setRequiredAction(
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Describe the action required for clearance."
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/25 focus:bg-white/[0.06]"
              />
            </div>

            <div>
              <label
                htmlFor="internal-notes"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
              >
                Internal Notes
              </label>

              <textarea
                id="internal-notes"
                value={internalNotes}
                onChange={(event) =>
                  setInternalNotes(
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Internal operational notes."
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/25 focus:bg-white/[0.06]"
              />
            </div>

            <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.04] p-4">
              <p className="text-sm font-medium text-amber-200">
                Customs workflow
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-100/45">
                Creating this case will place the shipment
                into the customs-clearance workflow. Payment
                requirements can be added after the case is
                opened.
              </p>
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
              {submitting
                ? "Creating Case..."
                : "Create Customs Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}