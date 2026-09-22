"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveCampaignButton({
  campaignId,
}: {
  campaignId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function approve() {
    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/approve`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Could not submit campaign");
      }

      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Could not submit campaign");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={approve}
        disabled={busy}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Submitting..." : "Approve & Submit"}
      </button>

      {error ? (
        <p className="max-w-xs text-right text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}