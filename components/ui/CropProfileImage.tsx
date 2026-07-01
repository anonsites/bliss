"use client";

import React from "react";
import styles from "../../app/checkpoint/checkpoint.module.css";

export type CropState = {
  x: number;
  y: number;
  zoom: number;
};

interface CropProfileImageProps {
  previewUrl: string;
  crop: CropState;
  onCropChange: (crop: CropState) => void;
  onSave?: () => void;
  onCancel?: () => void;
  title?: string;
}

/**
 * A standalone component for cropping/adjusting a profile image.
 * This handles the UI for zooming and panning an image within a circular frame.
 */
export function CropProfileImage({
  previewUrl,
  crop,
  onCropChange,
  onSave,
  onCancel,
  title = "Adjust Profile Picture",
}: CropProfileImageProps) {
  return (
    <div className={`${styles["complete-profile__section"]} p-6 space-y-6`}>
      <div className={styles["complete-profile__section-heading"]}>
        <h3>{title}</h3>
      </div>

      {/* Circular Cropping Frame */}
      <div className="flex justify-center py-4">
        <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-white/10 bg-white/5">
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-75"
            style={{
              backgroundImage: `url(${previewUrl})`,
              transform: `translate(${crop.x}px, ${crop.y}px) scale(${crop.zoom})`,
            }}
          />
          {/* Overlay to help visualize the center */}
          <div className="pointer-events-none absolute inset-0 border border-white/5 rounded-full" />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className={styles["complete-profile__range-field"]}>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Zoom</span>
            <span>{Math.round(crop.zoom * 100)}%</span>
          </div>
          <input
            max="3"
            min="1"
            onChange={(e) => onCropChange({ ...crop, zoom: Number(e.target.value) })}
            step="0.01"
            type="range"
            value={crop.zoom}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-highlight"
          />
        </div>

        <div className={styles["complete-profile__range-field"]}>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Horizontal Position</span>
          </div>
          <input
            max="100"
            min="-100"
            onChange={(e) => onCropChange({ ...crop, x: Number(e.target.value) })}
            step="1"
            type="range"
            value={crop.x}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-highlight"
          />
        </div>

        <div className={styles["complete-profile__range-field"]}>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Vertical Position</span>
          </div>
          <input
            max="100"
            min="-100"
            onChange={(e) => onCropChange({ ...crop, y: Number(e.target.value) })}
            step="1"
            type="range"
            value={crop.y}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-highlight"
          />
        </div>
      </div>

      {(onSave || onCancel) && (
        <div className="flex gap-3 pt-4 border-t border-white/5">
          {onCancel && (
            <button onClick={onCancel} className="home-button home-button--ghost flex-1 py-2 text-sm" type="button">
              Cancel
            </button>
          )}
          {onSave && (
            <button onClick={onSave} className="home-button home-button--primary flex-1 py-2 text-sm" type="button">
              Save Changes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
