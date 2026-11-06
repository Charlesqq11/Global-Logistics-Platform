"use client";

import { FormEvent, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Loader2,
  X,
} from "lucide-react";

type ArchiveShipmentModalProps = {
  tracking: string;
  onClose: () => void;
  onArchived: () => void;
};

export default function ArchiveShipmentModal({
  tracking,
  onClose,
  onArchived,
}: ArchiveShipmentModalProps) {
  const [confirmation, setConfirmation] =
    useState("");

  const [archiving, setArchiving] =
    useState(false);

  const [error, setError] =
    useState("");

  const canArchive =
    confirmation.trim().toLowerCase() ===
    tracking.trim().toLowerCase();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canArchive) {
      setError(
        "Enter the exact tracking number to confirm the archive.",
      );
      return;
    }

    setArchiving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/shipments/${encodeURIComponent(
          tracking,
        )}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to archive shipment.",
        );
      }

      onArchived();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to archive shipment.",
      );
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-shipment-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d10] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.08]">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
              </div>

              <div>
                <h2
                  id="archive-shipment-title"
                  className="text-lg font-semibold text-white"
                >
                  Archive Shipment
                </h2>

                <p className="mt-1 text-sm leading-6 text-white/45">
                  This shipment will be removed from
                  active operations while its records
                  remain preserved.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={archiving}
              className="rounded-xl border border-white/10 p-2 text-white/45 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Close archive shipment dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                Shipment to archive
              </p>

              <p className="mt-2 break-all font-mono text-sm font-medium text-white">
                {tracking}
              </p>
            </div>

            <div>
              <label
                htmlFor="archive-confirmation"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/45"
              >
                Confirm Tracking Number
              </label>

              <input
                id="archive-confirmation"
                type="text"
                autoComplete="off"
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(
                    event.target.value,
                  )
                }
                placeholder={tracking}
                disabled={archiving}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
              />

              <p className="mt-2 text-xs leading-5 text-white/35">
                Type the exact tracking number shown
                above to continue.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4">
                <p className="text-sm leading-6 text-red-200">
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-5">
            <button
              type="button"
              onClick={onClose}
              disabled={archiving}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canArchive || archiving}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.10] px-5 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/[0.15] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {archiving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}

              {archiving
                ? "Archiving..."
                : "Archive Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}