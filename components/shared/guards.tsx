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
      description="If you believe this is a mistake, contact the festival office (0803 681 8916) or your committee officer."
    />
  );
}
