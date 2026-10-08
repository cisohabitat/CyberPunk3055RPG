"use client";
import { useEffect } from "react";
import { recordIncident } from "@/lib/diagnostics";
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { recordIncident("render-error", error.digest); }, [error]);
  return <main className="title-screen"><section className="title-card"><p className="eyebrow">Connection interrupted</p><h1>The city paused.</h1><p>Your saved run and backup remain on this device. Reconnect to return to the title screen.</p><button type="button" className="primary" onClick={reset}>Reconnect</button></section></main>;
}
