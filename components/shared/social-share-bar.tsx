"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SocialShareBarProps {
  title?: string;
  url?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function SocialShareBar({
  title = "2026 Abeokuta Polo Festival — The Blueprint",
  url = "https://www.abeokutapolofestival2026.org.ng",
  description = "Join Nigeria's royal equestrian spectacle. 18–20 Dec 2026. Day 1 is 100% Free Public Entry!",
  className = "",
  compact = false,
}: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${title} — ${description}`);

  const shareLinks = [
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `🏇 ${title}\n${description}\n\n👉 Official Passes & Programme: ${url}`
      )}`,
      icon: MessageCircle,
      bg: "bg-[#25D366] text-black hover:bg-[#20ba5a]",
      textColor: "text-[#25D366]",
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=AbeokutaPolo2026,TheBlueprint,RoyalCup`,
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bg: "bg-black text-ivory border border-white/20 hover:bg-neutral-900",
      textColor: "text-ivory",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bg: "bg-[#1877F2] text-white hover:bg-[#0f65d4]",
      textColor: "text-[#1877F2]",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      bg: "bg-[#0A66C2] text-white hover:bg-[#084e96]",
      textColor: "text-[#0A66C2]",
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      icon: Send,
      bg: "bg-[#229ED9] text-white hover:bg-[#1a85b9]",
      textColor: "text-[#229ED9]",
    },
  ];

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Festival link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Could not copy link automatically");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        toast.success("Shared successfully!");
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="text-xs font-semibold text-muted-brand mr-1 hidden sm:inline">Share:</span>
        {shareLinks.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${item.name}`}
              className="flex size-7 items-center justify-center rounded-full bg-forest/10 hover:bg-forest/20 text-forest transition-transform hover:scale-110"
            >
              <Icon className="size-3.5" />
            </a>
          );
        })}
        <button
          onClick={handleCopy}
          aria-label="Copy Link"
          className="flex size-7 items-center justify-center rounded-full bg-gold/15 hover:bg-gold/25 text-gold-deep transition-transform hover:scale-110"
        >
          {copied ? <Check className="size-3.5 text-forest" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 border-gold/40 bg-card p-4 sm:p-5 shadow-md ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-line/60">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-forest text-gold">
            <Share2 className="size-4" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-forest leading-tight">
              Share The 2026 Abeokuta Polo Festival
            </h4>
            <p className="text-[11px] text-muted-brand">
              Invite friends, patrons &amp; polo enthusiasts across global networks
            </p>
          </div>
        </div>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            size="sm"
            onClick={handleNativeShare}
            className="bg-gold text-forest font-bold text-xs hover:bg-gold/90 shrink-0 self-start sm:self-auto"
          >
            <Share2 className="mr-1.5 size-3.5" /> Quick Share
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {shareLinks.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xs ${item.bg}`}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{item.name}</span>
            </a>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="border-line text-xs font-semibold hover:bg-sage/40 h-8"
        >
          {copied ? (
            <>
              <Check className="mr-1 size-3.5 text-forest" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="mr-1 size-3.5 text-muted-brand" />
              <span>Copy Link</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
