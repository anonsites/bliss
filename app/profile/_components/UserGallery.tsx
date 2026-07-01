"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { LoadingCircle } from "@/components/ui";
import styles from "./profile.module.css";
import { useMediaUpload } from "@/hooks/useMediaUpload";

interface UserGalleryProps {
  username: string;
  media: Array<{ id: string; media_url: string }>;
  onMediaChange?: (media: Array<{ id: string; media_url: string }>) => void;
}

const MAX_IMAGES = 6;

export function UserGallery({ username, media: initialMedia, onMediaChange }: UserGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState(initialMedia);
  const [uploadingMediaId, setUploadingMediaId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [viewingImageId, setViewingImageId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { isLoading, error, uploadMedia, updateMedia, deleteMedia } = useMediaUpload({
    onSuccess: (newMedia) => {
      setErrorMessage(null);
      setUploadingMediaId(null);
    },
    onError: (err) => {
      setErrorMessage(err);
      setUploadingMediaId(null);
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isNewImage = !uploadingMediaId;
    setUploadingMediaId(uploadingMediaId || `temp-${Date.now()}`);

    try {
      if (isNewImage) {
        // Upload new image
        const result = await uploadMedia(file);
        const updatedMedia = [...media, { id: result.id, media_url: result.media_url }];
        setMedia(updatedMedia);
        onMediaChange?.(updatedMedia);
      } else if (uploadingMediaId && uploadingMediaId !== `temp-${Date.now()}`) {
        // Update existing image
        const result = await updateMedia(uploadingMediaId, file);
        const updatedMedia = media.map((m) =>
          m.id === uploadingMediaId ? { ...m, media_url: result.media_url } : m
        );
        setMedia(updatedMedia);
        onMediaChange?.(updatedMedia);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      event.target.value = "";
    }
  }, [media, uploadingMediaId, uploadMedia, updateMedia, onMediaChange]);

  const handleImageClick = useCallback((e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    if (isLoading) return;
    
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    setDropdownPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height
    });
    
    setActiveDropdownId(activeDropdownId === mediaId ? null : mediaId);
  }, [isLoading, activeDropdownId]);

  const handleViewImage = useCallback((mediaId: string) => {
    setViewingImageId(mediaId);
    setActiveDropdownId(null);
  }, []);

  const handleReplaceImage = useCallback((mediaId: string) => {
    setUploadingMediaId(mediaId);
    setActiveDropdownId(null);
    fileInputRef.current?.click();
  }, []);

  const handleDeleteClick = useCallback(async (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    if (isLoading) return;

    const index = media.findIndex((m) => m.id === mediaId);
    // Rule: First 2 are mandatory.
    if (index <= 1) {
      setErrorMessage("The first two profile photos are mandatory and can only be replaced, not deleted.");
      return;
    }

    try {
      await deleteMedia(mediaId);
      const updatedMedia = media.filter((m) => m.id !== mediaId);
      setMedia(updatedMedia);
      onMediaChange?.(updatedMedia);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, [media, isLoading, deleteMedia, onMediaChange]);

  const handleAddPhotoClick = useCallback(() => {
    if (isLoading) return;
    setUploadingMediaId(null);
    fileInputRef.current?.click();
  }, [isLoading]);

  return (
    <section className="h-full flex flex-col">
      <div className={styles.sectionHeading}>
        <h2 className="text-2xl font-bold text-white">Gallery</h2>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300 border border-red-500/20">
          {errorMessage}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      <div className={styles.uploadGrid} ref={gridRef}>
        {Array.from({ length: MAX_IMAGES }).map((_, index) => {
          const item = media[index];
          const isNextToUpload = index === media.length;

          if (item) {
            return (
              <div
                key={item.id}
                className={`${styles.uploadSlot} ${styles.uploadSlotHasImage}`}
                style={{ position: 'relative' }}
              >
                <Image src={item.media_url} alt={`Gallery item ${index + 1}`} fill className="object-cover" />

                {uploadingMediaId === item.id && isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <LoadingCircle className="h-8 w-8 text-white" />
                  </div>
                )}

                {/* Overlay on hover/tap */}
                <div
                  onClick={(e) => handleImageClick(e, item.id)}
                  className={styles.galleryImageOverlay}
                >
                  <svg className={styles.galleryMenuIcon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                  </svg>
                </div>

                {index > 1 && (
                  <button
                    onClick={(e) => handleDeleteClick(e, item.id)}
                    className={styles.galleryDeleteBtn}
                    disabled={isLoading}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          }

          return (
            <div
              key={`slot-${index}`}
              className={styles.uploadSlot}
              onClick={isNextToUpload ? handleAddPhotoClick : undefined}
              style={{ 
                position: 'relative',
                cursor: isNextToUpload ? 'pointer' : 'default', 
                opacity: !isNextToUpload ? 0.4 : 1 
              }}
            >
              {isNextToUpload && (
                <>
                  <LoadingCircle className={`h-8 w-8 text-white ${isLoading && !uploadingMediaId ? "opacity-100" : "opacity-0"}`} />
                  {!isLoading && (
                    <svg className="h-8 w-8 text-white/20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Dropdown Menu Portal */}
      {activeDropdownId && (
        <div
          ref={dropdownRef}
          className={styles.galleryDropdown}
          style={{
            position: 'fixed',
            left: `${dropdownPosition.x}px`,
            top: `${dropdownPosition.y}px`,
            transform: 'translateX(-50%)',
            zIndex: 50
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleViewImage(activeDropdownId)}
            className={styles.galleryDropdownBtn}
          >
            <svg className={styles.galleryDropdownIcon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Image
          </button>
          <button
            onClick={() => handleReplaceImage(activeDropdownId)}
            className={styles.galleryDropdownBtn}
          >
            <svg className={styles.galleryDropdownIcon} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Replace Image
          </button>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImageId && (
        <div
          className={styles.galleryModalOverlay}
          onClick={() => setViewingImageId(null)}
        >
          <button
            onClick={() => setViewingImageId(null)}
            className={styles.galleryModalCloseBtn}
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className={styles.galleryModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={media.find((m) => m.id === viewingImageId)?.media_url || ""}
              alt="Full view"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </section>
  );
}
