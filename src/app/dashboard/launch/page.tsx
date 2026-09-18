import LaunchForm from "@/components/launch-form";

export const dynamic = "force-dynamic";

export default function LaunchPage() {
  const bookingUrl = process.env.BOOKING_URL || "https://keithmuoki.com/free-session";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Launch campaign</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set the budget — ClientLoop posts the tracked micro job to SproutGig and schedules it around your Reddit post.
        </p>
      </div>
      <LaunchForm bookingUrl={bookingUrl} />
    </div>
  );
}
