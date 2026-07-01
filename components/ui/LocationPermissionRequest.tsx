"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LocationPermissionRequestProps {
  message?: string;
  onLocationUpdated?: () => void;
  className?: string;
}

export function LocationPermissionRequest({
  message = "Bliss uses your location to show you people and drops nearby.",
  onLocationUpdated,
  className = "",
}: LocationPermissionRequestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEnableLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;

          const response = await fetch("/api/radar-feed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude,
              longitude,
              accuracyMeters: accuracy,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to sync location.");
          }

          if (onLocationUpdated) {
            onLocationUpdated();
          }
          
          router.refresh();
        } catch {
          setError("Failed to save location. Please try again.");
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access denied. Please enable permissions in your browser settings.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Location information is unavailable.");
        } else if (err.code === err.TIMEOUT) {
          setError("Location request timed out.");
        } else {
          setError("An unknown error occurred.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center h-full ${className}`}>
      <div className="mb-6 rounded-full bg-gray-900 p-6 text-[#00f0ff] ring-1 ring-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <h3 className="mb-3 text-xl font-bold text-white">Enable Location</h3>
      <p className="mb-8 max-w-sm text-gray-400 leading-relaxed">{message}</p>
      
      {error && (
        <div className="mb-6 w-full max-w-sm rounded-lg bg-red-950/40 p-3 text-sm text-red-200 border border-red-900/30">
          {error}
        </div>
      )}

      <button
        onClick={handleEnableLocation}
        disabled={isLoading}
        className="rounded-full bg-[#00f0ff] px-8 py-3 text-sm font-bold text-black transition hover:bg-[#00f0ff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Locating..." : "Enable Location"}
      </button>
    </div>
  );
}
