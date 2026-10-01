"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Props = {
  textToCopy: string;
  label?: string;
  className?: string;
};

export default function SalinTeksButton({
  textToCopy,
  label = "Salin",
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback manual jika clipboard api ditolak browser
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      } ${className}`}
      title="Salin ke papan klip"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span>Tersalin!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-gray-500" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
