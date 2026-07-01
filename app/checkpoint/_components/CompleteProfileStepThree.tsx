"use client";

import { useState } from "react";
import { ErrorAlert } from "@/components/alerts/ErrorAlert";
import { LoadingCircle } from "@/components/ui/LoadingCircle";
import styles from "../checkpoint.module.css";

type CompleteProfileStepThreeProps = {
  error?: string | null;
  isSubmitting?: boolean;
  onBack: () => void;
  onNext: (position: GeolocationPosition) => void;
};

export function CompleteProfileStepThree({
  error: externalError,
  isSubmitting = false,
  onBack,
  onNext,
}: CompleteProfileStepThreeProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!("geolocation" in navigator)) {
      setIsLoading(false);
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false);
        onNext(position);
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission is required to use the app. Please allow access in your browser settings.");
        } else {
          setError("Unable to retrieve location. Please try again.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  return (
    <div className={`${styles["complete-profile__form"]} space-y-6`}>
        <p className="text-center text-gray-400 leading-relaxed">
          Bliss uses your location to show hot profiles around your area. Tap enable to get started.
        </p>

        {(error || externalError) && (
          <ErrorAlert title="Location Required">
            {error || externalError}
          </ErrorAlert>
        )}

        <div className={styles["complete-profile__footer-buttons"]}>
          <button
            className={styles["complete-profile__button-primary"]}
            disabled={isLoading || isSubmitting}
            onClick={handleRequestLocation}
            type="button"
          >
            {isLoading ? (
              "Locating..."
            ) : isSubmitting ? (
              <>
                <LoadingCircle aria-hidden="true" className="h-4 w-4" />
                <span>Finishing...</span>
              </>
            ) : (
              "Enable Location"
            )}
          </button>
        </div>
      </div>
  );
}
