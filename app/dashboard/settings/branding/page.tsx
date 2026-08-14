"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// app/dashboard/settings/branding/page.tsx
//
// New page. Simple logo upload — separate from your existing
// settings page so it doesn't conflict with whatever's already
// there. Link to it from your Settings page/nav however you like,
// e.g. <Link href="/dashboard/settings/branding">Branding</Link>.
//
// NOTE: this is a client component with no server-side session
// check of its own — the /api/upload/logo route it calls DOES check
// the session server-side, so it's still secure; add a redirect
// here too if you want the page itself gated for logged-out users.

export default function BrandingPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      setPreview(data.logoUrl);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Organization Logo</h1>
        <p className="mt-1 text-slate-500">
          Appears on every generated document (PDF) where "Show organization logo" is enabled in that
          document type's template.
        </p>

        <div className="mt-6 flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Logo preview" className="max-h-20 max-w-20 object-contain" />
            ) : (
              <span className="text-xs text-slate-400">No logo</span>
            )}
          </div>

          <div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="block text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-2 text-xs text-slate-400">PNG, JPEG, SVG, or WebP. Max 2MB.</p>
            {uploading && <p className="mt-2 text-xs text-blue-600">Uploading...</p>}
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
