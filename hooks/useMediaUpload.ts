"use client";

import { useState } from "react";

type MediaItem = {
  id: string;
  media_url: string;
  sort_order: number;
  created_at: string;
};

type UseMediaUploadOptions = {
  onSuccess?: (media: MediaItem) => void;
  onError?: (error: string) => void;
};

export function useMediaUpload(options?: UseMediaUploadOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem | null>(null);

  const uploadMedia = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/media", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        media?: MediaItem;
      };

      if (!response.ok) {
        const errorMessage = data.error || "Failed to upload image";
        setError(errorMessage);
        options?.onError?.(errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.media) {
        throw new Error("No media data returned from server");
      }

      setMedia(data.media);
      options?.onSuccess?.(data.media);
      return data.media;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      options?.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMedia = async (mediaId: string, file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaId", mediaId);

      const response = await fetch("/api/profile/media", {
        method: "PATCH",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        media?: MediaItem;
      };

      if (!response.ok) {
        const errorMessage = data.error || "Failed to update image";
        setError(errorMessage);
        options?.onError?.(errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.media) {
        throw new Error("No media data returned from server");
      }

      setMedia(data.media);
      options?.onSuccess?.(data.media);
      return data.media;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      options?.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile/media?id=${mediaId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok) {
        const errorMessage = data.error || "Failed to delete image";
        setError(errorMessage);
        options?.onError?.(errorMessage);
        throw new Error(errorMessage);
      }

      setMedia(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      options?.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    media,
    uploadMedia,
    updateMedia,
    deleteMedia,
  };
}
