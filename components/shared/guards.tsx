import { EmptyState } from "@/components/shared/empty-state";

export function NotConfigured() {
  return (
    <EmptyState
      title="Database not configured"
      description="Supabase env vars are missing. Copy .env.example to .env.local and fill in the public URL and anon key to enable this area."
    />
  );
}

export function PermissionDenied() {
  return (
    <EmptyState
      title="You do not have access to this area"
      description={
        <span>
          If you believe this is a mistake, contact the festival office (
          <a href="tel:08036818916" className="font-bold underline hover:text-gold text-forest">
            0803 681 8916
          </a>
          ) or WhatsApp (
          <a
            href="https://wa.me/2348181888884?text=Hello%20Festival%20Secretariat,%20I%20am%20enquiring%20about%20portal%20access."
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline hover:text-gold text-forest"
          >
            +234 818 188 8884
          </a>
          ).
        </span>
      }
    />
  );
}
