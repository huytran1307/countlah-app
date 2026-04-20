import { useState, useEffect } from "react";

interface Branding {
  logoUrl: string | null;
  companyName: string | null;
}

let cached: Branding | null = null;
const listeners: Array<(b: Branding) => void> = [];

function setFavicon(url: string | null) {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  if (url) {
    link.href = url;
    link.type = url.startsWith("data:image/svg") ? "image/svg+xml"
      : url.startsWith("data:image/png") ? "image/png"
      : url.startsWith("data:image/webp") ? "image/webp"
      : "image/jpeg";
  } else {
    link.href = "/favicon.svg";
    link.type = "image/svg+xml";
  }
}

function notify(b: Branding) {
  cached = b;
  setFavicon(b.logoUrl);
  listeners.forEach(fn => fn(b));
}

export function invalidateBrandingCache() {
  cached = null;
}

export async function refreshBranding(): Promise<void> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}api/branding`, { credentials: "include" });
    if (res.ok) {
      const data: Branding = await res.json();
      notify(data);
    }
  } catch {}
}

export function useBranding(): Branding {
  const [branding, setBranding] = useState<Branding>(cached ?? { logoUrl: null, companyName: null });

  useEffect(() => {
    listeners.push(setBranding);
    if (!cached) refreshBranding();
    else setBranding(cached);
    return () => {
      const idx = listeners.indexOf(setBranding);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return branding;
}
