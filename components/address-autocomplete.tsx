"use client";

import * as React from "react";

import { cn } from "@/lib/helpers";
import { FieldError } from "@/components/form-primitives";

/**
 * Property-address input backed by Google Places Autocomplete. Selecting a
 * suggestion fills street / city / state / zip via {@link onSelect}; typing
 * always updates the raw text via {@link onChange}. Degrades to a plain text
 * input when the Maps script can't load (e.g. a placeholder API key), so the
 * form stays usable until a real key is configured.
 *
 * Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (see .env).
 */

export interface AddressParts {
  line1: string;
  city: string;
  state: string;
  zip: string;
}

/* Minimal Google Places typings — avoids a hard @types/google.maps dependency. */
interface GAddressComponent {
  types: string[];
  long_name: string;
  short_name: string;
}
interface GPlaceResult {
  address_components?: GAddressComponent[];
}
interface GAutocomplete {
  addListener(event: string, cb: () => void): void;
  getPlace(): GPlaceResult;
}
interface GNamespace {
  maps?: {
    places?: {
      Autocomplete: new (
        input: HTMLInputElement,
        opts?: Record<string, unknown>,
      ) => GAutocomplete;
    };
    event?: { clearInstanceListeners(instance: unknown): void };
  };
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "FAKE_GOOGLE_MAPS_API_KEY";

let mapsPromise: Promise<GNamespace | null> | null = null;

/** Load the Maps JS API (Places) once; resolves null if it can't load. */
function loadGoogleMaps(): Promise<GNamespace | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const existing = (window as unknown as { google?: GNamespace }).google;
  if (existing?.maps?.places) return Promise.resolve(existing);
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve) => {
    const done = () => resolve((window as unknown as { google?: GNamespace }).google ?? null);
    const prior = document.querySelector<HTMLScriptElement>("script[data-google-maps]");
    if (prior) {
      prior.addEventListener("load", done);
      prior.addEventListener("error", () => resolve(null));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-maps", "true");
    script.onload = done;
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return mapsPromise;
}

function parsePlace(place: GPlaceResult): AddressParts | null {
  const comps = place.address_components;
  if (!comps) return null;
  const get = (type: string, short = false): string => {
    const c = comps.find((x) => x.types.includes(type));
    return c ? (short ? c.short_name : c.long_name) : "";
  };
  const line1 = [get("street_number"), get("route")].filter(Boolean).join(" ");
  const city = get("locality") || get("sublocality") || get("postal_town");
  return { line1, city, state: get("administrative_area_level_1", true), zip: get("postal_code") };
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (parts: AddressParts) => void;
  placeholder?: string;
  error?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Keep the latest onSelect without re-attaching the listener.
  const onSelectRef = React.useRef(onSelect);
  React.useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  React.useEffect(() => {
    let autocomplete: GAutocomplete | null = null;
    let cancelled = false;
    void loadGoogleMaps().then((g) => {
      if (cancelled || !g?.maps?.places || !inputRef.current) return;
      try {
        autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["address_components"],
        });
        autocomplete.addListener("place_changed", () => {
          const parts = autocomplete && parsePlace(autocomplete.getPlace());
          if (parts) onSelectRef.current(parts);
        });
      } catch {
        // Places unavailable (e.g. placeholder key) — plain input still works.
      }
    });
    return () => {
      cancelled = true;
      const g = (window as unknown as { google?: GNamespace }).google;
      if (autocomplete) g?.maps?.event?.clearInstanceListeners(autocomplete);
    };
  }, []);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring aria-invalid:border-destructive md:text-sm dark:bg-input/30",
        )}
      />
      {error && <FieldError message={error} />}
    </>
  );
}
