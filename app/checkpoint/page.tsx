"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AuthModalBrand } from "../../components/ui/AuthModalBrand";
import { MobileTopNav } from "@/components/layout/MobileTopNav";
import type { AuthActionResponse } from "@/features/auth";
import styles from "./checkpoint.module.css";
import {
  clearPendingSignupDraft,
  readPendingSignupDraft,
  subscribePendingSignupDraft,
  type PendingSignupDraft,
} from "@/features/auth/signup-draft";
import { useToast } from "@/lib/toast-context";
import { CompleteProfileStepOne } from "./_components/CompleteProfileStepOne";
import { CompleteProfileStepTwo } from "./_components/CompleteProfileStepTwo";
import { CompleteProfileStepThree } from "./_components/CompleteProfileStepThree";
import {
  type CompleteProfileData,
  type CropState,
  type GenderOption,
  type StepOneErrors,
  type StepTwoErrors,
} from "./_components/profile-utils";

type CompleteProfileProps = {
  onBack: () => void;
  onCancel: () => void;
  onComplete?: (profile: CompleteProfileData) => void | Promise<void>;
  onError?: (error: string) => void;
  phoneNumber: string;
  step: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
};

export function CompleteProfile({
  onBack,
  onCancel,
  onComplete,
  onError,
  step,
  onStepChange,
}: CompleteProfileProps) {
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<GenderOption | undefined>(undefined);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<[File | null, File | null]>([null, null]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [crop, setCrop] = useState<CropState>({ zoom: 1, x: 0, y: 0 });
  const [stepOneErrors, setStepOneErrors] = useState<StepOneErrors>({});
  const [stepTwoErrors, setStepTwoErrors] = useState<StepTwoErrors>({});
  const [stepThreeError, setStepThreeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeStepMeta =
    step === 1
      ? {
          progress: 33,
        }
      : step === 2
        ? {
            progress: 67,
          }
        : {
            progress: 100,
          };

  useEffect(() => {
    return () => {
      if (profilePreviewUrl) {
        URL.revokeObjectURL(profilePreviewUrl);
      }

      galleryPreviewUrls.forEach((previewUrl) => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [galleryPreviewUrls, profilePreviewUrl]);

  const handleProfileImageChange = (file: File | null) => {
    if (profilePreviewUrl) {
      URL.revokeObjectURL(profilePreviewUrl);
    }

    setProfileImage(file);
    setProfilePreviewUrl(file ? URL.createObjectURL(file) : null);
    setCrop({ zoom: 1, x: 0, y: 0 });
    setStepTwoErrors((current) => ({ ...current, profileImage: undefined, submit: undefined }));
    setStepThreeError(null);
  };

  const handleGalleryImageChange = (index: 0 | 1, file: File | null) => {
    const previousPreview = galleryPreviewUrls[index];

    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
    }

    setGalleryImages((current) => {
      const next = [...current] as [File | null, File | null];
      next[index] = file;
      return next;
    });

    setGalleryPreviewUrls((current) => {
      const next = [...current] as [string | null, string | null];
      next[index] = file ? URL.createObjectURL(file) : null;
      return next;
    });

    setStepTwoErrors((current) => ({ ...current, galleryImages: undefined, submit: undefined }));
    setStepThreeError(null);
  };

  const handleFinalSubmit = async (position: GeolocationPosition) => {
    setIsSubmitting(true);
    setStepThreeError(null);

    try {
      if (!gender) {
        throw new Error("Gender is required to finish your profile.");
      }

      const payload: CompleteProfileData = {
        age: Number(age),
        galleryImages: [galleryImages[0]!, galleryImages[1]!],
        gender,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        profileImage: croppedImage!,
        username: username.trim(),
      };

      if (onComplete) {
        await onComplete(payload);
      }
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
        ? error.message
        : "An unexpected error occurred. Please try again.";
      setStepThreeError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="checkpoint-page__panel" aria-labelledby="complete-profile-title">
      <div
        aria-label={`Step ${step} of 3`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={activeStepMeta.progress}
        className="checkpoint-progress"
        role="progressbar"
      >
        <div className="checkpoint-progress__track">
          <span
            className="checkpoint-progress__fill"
            style={{ width: `${activeStepMeta.progress}%` }}
          />
        </div>
      </div>

      {step === 1 ? (
        <CompleteProfileStepOne
          age={age}
          errors={stepOneErrors}
          gender={gender}
          onBack={onBack}
          onCancel={onCancel}
          onErrorsChange={setStepOneErrors}
          onNext={() => onStepChange(2)}
          onUpdate={(data) => {
            if (data.username !== undefined) setUsername(data.username);
            if (data.age !== undefined) setAge(data.age);
            if ("gender" in data) setGender(data.gender);
            setStepThreeError(null);
          }}
          username={username}
        />
      ) : step === 2 ? (
        <CompleteProfileStepTwo
          crop={crop}
          errors={stepTwoErrors}
          galleryPreviewUrls={galleryPreviewUrls}
          isSubmitting={isSubmitting}
          onBack={() => onStepChange(1)}
          onCancel={onCancel}
          onCropChange={setCrop}
          onErrorsChange={setStepTwoErrors}
          onGalleryChange={handleGalleryImageChange}
          onProfileChange={handleProfileImageChange}
          onSubmit={(data) => {
            setCroppedImage(data.profileImage);
            onStepChange(3);
          }}
          profileImage={profileImage}
          profilePreviewUrl={profilePreviewUrl}
        />
      ) : (
        <CompleteProfileStepThree
          error={stepThreeError}
          isSubmitting={isSubmitting}
          onBack={() => onStepChange(2)}
          onNext={(position) => {
            handleFinalSubmit(position);
          }}
        />
      )}
    </section>
  );
}

function buildRegistrationFormData(
  draft: PendingSignupDraft,
  profile: CompleteProfileData,
) {
  if (!profile.location) {
    throw new Error("Location is required to finish your profile.");
  }

  const formData = new FormData();

  formData.append("phoneNumber", draft.phoneNumber);
  formData.append("password", draft.password);
  formData.append("username", profile.username);
  formData.append("age", String(profile.age));
  formData.append("gender", profile.gender);
  formData.append("profileImage", profile.profileImage);
  formData.append("galleryImage0", profile.galleryImages[0]);
  formData.append("galleryImage1", profile.galleryImages[1]);
  formData.append("latitude", String(profile.location.latitude));
  formData.append("longitude", String(profile.location.longitude));

  return formData;
}

export default function CheckpointPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isClient, setIsClient] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const signupDraft = useSyncExternalStore(
    subscribePendingSignupDraft,
    readPendingSignupDraft,
    () => null,
  );

  useEffect(() => {
    if (isClient && errorMessage) {
      addToast({
        type: "error",
        title: "Profile Creation Failed",
        message: errorMessage,
        duration: 6000,
      });
      setTimeout(() => setErrorMessage(null), 0);
    }
  }, [isClient, errorMessage, addToast, setErrorMessage]);

  useEffect(() => {
    if (signupDraft === null) {
      router.replace("/?auth=register");
    }
  }, [router, signupDraft]);

  const handleBackToCredentials = () => {
    router.push("/?auth=register");
  };

  const handleProfileError = (errorMessage: string) => {
    setErrorMessage(errorMessage);
  };

  const handleCancel = () => {
    clearPendingSignupDraft();
    router.push("/");
  };

  const handleProfileComplete = async (profile: CompleteProfileData) => {
    const activeDraft = signupDraft ?? readPendingSignupDraft();

    if (!activeDraft) {
      throw new Error("Your sign up session expired. Start again with your phone number and password.");
    }

    const response = await fetch("/api/auth/register", {
      body: buildRegistrationFormData(activeDraft, profile),
      method: "POST",
    });
    const payload = (await response.json()) as AuthActionResponse;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to create your account.");
    }

    addToast({
      type: "success",
      message: "Welcome to Bliss! Your profile is ready.",
      duration: 4000,
    });
    clearPendingSignupDraft();
    router.push(payload.redirectTo ?? "/radar");
    router.refresh();
  };

  const activeStepTitle =
    step === 1 ? "Profile Details" : step === 2 ? "Profile Images" : "Profile Location";

  if (signupDraft === undefined || signupDraft === null) {
    return (
      <main className={styles["checkpoint-page"]}>
        <MobileTopNav />
        <div className={`${styles["checkpoint-page__shell"]} ${styles["checkpoint-page__shell--single"]}`}>
          <section className={styles["checkpoint-page__panel"]}>
            <div className={styles["checkpoint-page__panel-header"]}>
              <AuthModalBrand />
              <p className="complete-profile__eyebrow">Create account</p>
              <h2>Redirecting to sign up...</h2>
            </div>
          </section>
        </div>
      </main>
    );
  }


  return (
    <main className={styles["checkpoint-page"]}>
      <MobileTopNav />
      <div className={styles["checkpoint-page__shell"]}>
        <aside className={styles["checkpoint-page__intro"]}>
          <AuthModalBrand />
          <div className="flex flex-col items-center gap-3">
            <div className={styles["checkpoint-page__phone-pill"]}>{signupDraft.phoneNumber}</div>
            <h2 className={styles["complete-profile__page-title"]}>{activeStepTitle}</h2>
          </div>
        </aside>

        <CompleteProfile
          onBack={handleBackToCredentials}
          onCancel={handleCancel}
          onComplete={handleProfileComplete}
          onError={handleProfileError}
          phoneNumber={signupDraft.phoneNumber}
          step={step}
          onStepChange={setStep}
        />
      </div>
    </main>
  );
}
