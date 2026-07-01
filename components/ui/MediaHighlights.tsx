import {
  getPrimaryMediaItem,
  getProfileMediaHighlights,
  type HomeFeedProfile,
  type MediaSource,
} from "@/features/discovery";

interface MediaHighlightsProps {
  profile: HomeFeedProfile;
  source?: MediaSource;
}

function ImageIcon() {
  return (
    <svg
      aria-hidden="true"
      className="grid-media-highlight__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
      <circle cx="8.5" cy="10.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="grid-media-highlight__icon"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M8 6.5v11l8.5-5.5L8 6.5z" />
    </svg>
  );
}

export function MediaHighlights({
  profile,
  source = "profile",
}: MediaHighlightsProps) {
  const { imageCount, videoCount } = getProfileMediaHighlights(profile, source);
  const primaryMedia = getPrimaryMediaItem(profile, source);
  const isVideoPreview = primaryMedia?.type === "video";

  return (
    <>
      <div className="grid-media-highlights">
        {videoCount > 0 ? (
          <span className="grid-media-highlight">
            <VideoIcon />
            <strong>{videoCount}</strong>
          </span>
        ) : null}

        {imageCount > 0 ? (
          <span className="grid-media-highlight">
            <ImageIcon />
            <strong>{imageCount}</strong>
          </span>
        ) : null}
      </div>

      {isVideoPreview ? (
        <span className="grid-media-preview-badge" aria-label="Video preview">
          <VideoIcon />
        </span>
      ) : null}
    </>
  );
}
