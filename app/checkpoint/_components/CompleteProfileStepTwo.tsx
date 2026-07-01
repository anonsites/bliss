import { useId } from "react";
import styles from "../checkpoint.module.css";
import {
  type CropState,
  type StepTwoErrors,
} from "./profile-utils";

type CompleteProfileStepTwoProps = {
  profileImage: File | null;
  profilePreviewUrl: string | null;
  galleryPreviewUrls: [string | null, string | null];
  crop: CropState;
  errors: StepTwoErrors;
  isSubmitting: boolean;
  onProfileChange: (file: File | null) => void;
  onGalleryChange: (index: 0 | 1, file: File | null) => void;
  onCropChange: (crop: CropState) => void;
  onSubmit: (data: { profileImage: File }) => void;
  onErrorsChange: (errors: StepTwoErrors) => void;
  onBack: () => void;
  onCancel: () => void;
};

type UploadSlotProps = {
  inputId: string;
  onChange: (file: File | null) => void;
  previewUrl: string | null;
};

function PlaceholderIcon() {
  return (
    <svg className="h-8 w-8 text-white/10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7m4 0h6m-3-3v6M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
      viewBox="0 0 24 24"
    >
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  );
}

function UploadSlot({ inputId, onChange, previewUrl }: UploadSlotProps) {
  return (
    <label 
      className="relative flex aspect-[3/4] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/10 bg-white/5 transition-all hover:bg-white/10" 
      htmlFor={inputId}
    >
      {previewUrl ? (
        <div 
          className="h-full w-full bg-cover bg-center" 
          style={{ backgroundImage: `url(${previewUrl})` }} 
        />
      ) : (
        <PlaceholderIcon />
      )}

      <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${previewUrl ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
          <PlusIcon />
        </div>
      </div>

      <input
        accept="image/*"
        className={styles["complete-profile__file-input"]}
        id={inputId}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        type="file"
      />
    </label>
  );
}

export function CompleteProfileStepTwo({
  profileImage,
  profilePreviewUrl,
  galleryPreviewUrls,
  errors,
  isSubmitting,
  onProfileChange,
  onGalleryChange,
  onSubmit,
  onErrorsChange,
}: CompleteProfileStepTwoProps) {
  const profileInputId = useId();
  const galleryInputIds = [useId(), useId()] as const;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: StepTwoErrors = {};

    if (!profileImage) {
      nextErrors.profileImage = "A profile photo is required.";
    }

    if (galleryPreviewUrls.some((url) => !url)) {
      nextErrors.galleryImages = "Upload both extra photos to finish your profile.";
    }

    onErrorsChange(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      // Passing original image directly to keep the flow simple and avoid cropping
      onSubmit({ profileImage: profileImage! });
    } catch (error) {
      console.error(error);
      onErrorsChange({
        submit: "We could not prepare your images. Try again with a different file.",
      });
    }
  };

  return (
    <form
        className={`modal-form ${styles["complete-profile__form"]} space-y-4`}
        onSubmit={handleSubmit}
      >
        <section className={`${styles["complete-profile__section"]} p-4`}>
          <div className={styles["complete-profile__section-heading"]}>
            <div>
              <h3 className={styles["complete-profile__section-title"]}>Add profile picture</h3>
            </div>
          </div>

        <input
          accept="image/*"
          className={styles["complete-profile__file-input"]}
          id={profileInputId}
          onChange={(event) => onProfileChange(event.target.files?.[0] ?? null)}
          type="file"
        />

        <div className="flex justify-center py-2">
          <label 
            className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-4 border-white/10 bg-white/5 transition-all hover:border-highlight/50"
            htmlFor={profileInputId}
          >
            {profilePreviewUrl ? (
              <div 
                className="h-full w-full bg-cover bg-center" 
                style={{ backgroundImage: `url(${profilePreviewUrl})` }} 
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <PlaceholderIcon />
              </div>
            )}
            
            <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${profilePreviewUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                <PlusIcon />
              </div>
            </div>
          </label>
        </div>

        {errors.profileImage ? (
          <p className={styles["complete-profile__error"]}>{errors.profileImage}</p>
        ) : null}
      </section>

      <section className={`${styles["complete-profile__section"]} p-4`}>
        <div className={styles["complete-profile__section-heading"]}>
          <div>
            <h3 className={styles["complete-profile__section-title"]}>Add 2 more images</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <UploadSlot
            inputId={galleryInputIds[0]}
            onChange={(file) => onGalleryChange(0, file)}
            previewUrl={galleryPreviewUrls[0]}
          />

          <UploadSlot
            inputId={galleryInputIds[1]}
            onChange={(file) => onGalleryChange(1, file)}
            previewUrl={galleryPreviewUrls[1]}
          />
        </div>

        {errors.galleryImages ? (
          <p className={styles["complete-profile__error"]}>{errors.galleryImages}</p>
        ) : null}
        {errors.submit ? (
          <p className={styles["complete-profile__error"]}>{errors.submit}</p>
        ) : null}
      </section>

      <div className={styles["complete-profile__footer-buttons"]}>
        <button
          className={styles["complete-profile__button-primary"]}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </button>
      </div>
    </form>
  );
}
