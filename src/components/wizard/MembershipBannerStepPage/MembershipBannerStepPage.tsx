import { useEffect, useRef, useState } from "react";
import FilerobotImageEditor from "filerobot-image-editor";
import { MEMBERSHIP_BANNER_CONTENT } from "./MembershipBannerStepPage.fields";
import { useMembershipBannerStep } from "./MembershipBannerStepPage.hooks";
import type {
  BannerSourceMode,
  UnsplashOrientation,
  UnsplashPhoto,
} from "./MembershipBannerStepPage.types";

const UNSPLASH_ORIENTATION_OPTIONS: Array<{
  label: string;
  value: UnsplashOrientation;
}> = [
  { label: "Landscape", value: "landscape" },
  { label: "Portrait", value: "portrait" },
  { label: "Square", value: "squarish" },
  { label: "Any", value: "any" },
];

function getUnsplashPreviewAspectClass(orientation: UnsplashOrientation) {
  switch (orientation) {
    case "portrait":
      return "aspect-[4/5]";
    case "squarish":
      return "aspect-square";
    case "any":
      return "aspect-[16/9]";
    case "landscape":
    default:
      return "aspect-[16/9]";
  }
}

function getUnsplashPreviewLabel(orientation: UnsplashOrientation) {
  switch (orientation) {
    case "portrait":
      return "Portrait preview";
    case "squarish":
      return "Square preview";
    case "any":
      return "Flexible preview";
    case "landscape":
    default:
      return "Landscape preview";
  }
}

function getBannerPreviewAspectClass(source: BannerSourceMode, orientation: UnsplashOrientation) {
  if (source === "upload") {
    return "aspect-[16/9]";
  }

  return getUnsplashPreviewAspectClass(orientation);
}

function getBannerPreviewLabel(source: BannerSourceMode, orientation: UnsplashOrientation) {
  if (source === "upload") {
    return "Uploaded preview";
  }

  return getUnsplashPreviewLabel(orientation);
}

function MembershipBannerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="h-[18rem] rounded-[1.75rem] border border-slate-200 bg-slate-100 animate-pulse" />
        <div className="h-[18rem] rounded-[1.75rem] border border-slate-200 bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

function MembershipBannerError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-rose-400/50 text-[10px] font-bold">
          !
        </div>
        <div className="space-y-2">
          <p>{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function UnsplashPhotoCard({
  photo,
  onUse,
  disabled,
}: {
  photo: UnsplashPhoto;
  onUse: (photo: UnsplashPhoto) => void | Promise<boolean>;
  disabled?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        className="block w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => void onUse(photo)}
        disabled={disabled}
      >
        <img
          src={photo.imageUrl}
          alt={photo.altDescription}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
        <div className="flex items-center justify-center px-4 py-3">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-600">
            {photo.width} × {photo.height}
          </span>
        </div>
      </button>
    </article>
  );
}

export function MembershipBannerStepPage() {
  const {
    bannerUrl,
    bannerSource,
    bannerUploadError,
    bannerEditError,
    clearBannerSelection,
    error,
    isLoading,
    isEditingBanner,
    isUploadingBanner,
    reload,
    unsplashQuery,
    unsplashResults,
    unsplashTotalResults,
    isSearchingUnsplash,
    isLoadingMoreUnsplash,
    hasMoreUnsplashResults,
    unsplashSearchError,
    selectedUnsplashPhoto,
    unsplashOrientation,
    setBannerSource,
    setUnsplashQuery,
    setUnsplashOrientation,
    openBannerEditor,
    closeBannerEditor,
    searchUnsplash,
    completeBannerEdit,
    loadMoreUnsplash,
    selectUnsplashPhoto,
    uploadBannerImage,
  } = useMembershipBannerStep();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const unsplashQueryInputRef = useRef<HTMLInputElement | null>(null);
  const uploadSectionRef = useRef<HTMLElement | null>(null);
  const uploadDragDepthRef = useRef(0);
  const [isUploadDragActive, setIsUploadDragActive] = useState(false);
  const [isUnsplashModalOpen, setIsUnsplashModalOpen] = useState(false);

  const handleReplaceBanner = () => {
    if (bannerSource === "upload") {
      uploadInputRef.current?.click();
      return;
    }

    setIsUnsplashModalOpen(true);
  };

  const handleEditBanner = () => {
    if (!bannerUrl) {
      return;
    }

    openBannerEditor();
  };

  const handleOpenUnsplashModal = () => {
    setBannerSource("unsplash");
    setIsUnsplashModalOpen(true);
  };

  const handleCloseUnsplashModal = () => {
    setIsUnsplashModalOpen(false);
  };

  const handleSelectUnsplashPhoto = (photo: UnsplashPhoto) => {
    return selectUnsplashPhoto(photo).then((success) => {
      if (success) {
        setIsUnsplashModalOpen(false);
      }

      return success;
    });
  };

  const handleUploadFiles = (files: FileList | null | undefined) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    void uploadBannerImage(file);
  };

  useEffect(() => {
    if (!isUnsplashModalOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUnsplashModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const timer = window.setTimeout(() => {
      unsplashQueryInputRef.current?.focus();
    }, 0);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isUnsplashModalOpen]);

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipBannerError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_BANNER_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_BANNER_CONTENT.description}</p>
      </div>

      <div className="mt-8 max-w-5xl space-y-6">
        {isLoading ? (
          <MembershipBannerSkeleton />
        ) : (
          <>
            <div
              className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6"
              tabIndex={-1}
              data-wizard-focus="true"
            >
              <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">
                Optional step
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">{MEMBERSHIP_BANNER_CONTENT.emptyStateTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {MEMBERSHIP_BANNER_CONTENT.emptyStateDescription}
              </p>
              <p className="mt-5 text-sm text-slate-500">{MEMBERSHIP_BANNER_CONTENT.helper}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setBannerSource("upload")}
                className={[
                  "rounded-[1.5rem] border p-5 text-left transition",
                  bannerSource === "upload"
                    ? "border-cyan-300 bg-cyan-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-cyan-200 hover:shadow-sm",
                ].join(" ")}
              >
                <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">Upload your own</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Use a local image</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Upload a banner file from your device and we’ll keep it ready for saving.
                </p>
              </button>
              <button
                type="button"
                onClick={handleOpenUnsplashModal}
                className={[
                  "rounded-[1.5rem] border p-5 text-left transition",
                  bannerSource === "unsplash"
                    ? "border-cyan-300 bg-cyan-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-cyan-200 hover:shadow-sm",
                ].join(" ")}
              >
                <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">Browse Unsplash</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Choose from curated photos</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Search and filter stock photos, then pick one that fits your banner.
                </p>
              </button>
            </div>

            {bannerUrl ? (
              <section className="rounded-[1.75rem] border border-cyan-100 bg-cyan-50/60 p-5 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">
                      Current banner preview
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Selected banner image</h2>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                      This is the image that will be saved as the banner for the membership type.
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      {getBannerPreviewLabel(bannerSource, unsplashOrientation)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleReplaceBanner}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleEditBanner}
                      className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={clearBannerSelection}
                      className="inline-flex rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div
                  className={`mt-4 overflow-hidden rounded-[1.25rem] border border-cyan-100 bg-slate-100 p-2 ${getBannerPreviewAspectClass(bannerSource, unsplashOrientation)}`}
                >
                  <div className="relative h-full w-full">
                    <img
                      src={bannerUrl}
                      alt={selectedUnsplashPhoto?.altDescription || "Selected membership banner"}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <p className="break-all">{bannerUrl}</p>
                  <p className="text-xs leading-5 text-slate-500">
                    {bannerSource === "unsplash" && selectedUnsplashPhoto
                      ? `Selected from Unsplash by ${selectedUnsplashPhoto.photographerName}`
                      : "Stored banner image"}
                  </p>
                </div>
                {bannerEditError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {bannerEditError}
                  </div>
                ) : null}
              </section>
            ) : null}

            {bannerSource === "upload" ? (
              <section ref={uploadSectionRef} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">
                    Upload your own
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Upload a banner file</h2>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    Choose a JPG, PNG, or WEBP file from your device. We’ll upload it and use it as the banner.
                  </p>
                </div>

                <label
                  htmlFor="membership-banner-upload"
                  onDragEnter={(event) => {
                    event.preventDefault();
                    uploadDragDepthRef.current += 1;
                    setIsUploadDragActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!isUploadingBanner) {
                      setIsUploadDragActive(true);
                    }
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    uploadDragDepthRef.current = Math.max(0, uploadDragDepthRef.current - 1);
                    if (uploadDragDepthRef.current === 0) {
                      setIsUploadDragActive(false);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    uploadDragDepthRef.current = 0;
                    setIsUploadDragActive(false);
                    handleUploadFiles(event.dataTransfer.files);
                  }}
                  className={[
                    "mt-4 block rounded-[1.5rem] border-2 border-dashed bg-white p-5 transition",
                    isUploadDragActive
                      ? "border-cyan-400 bg-cyan-50/70"
                      : "border-slate-200 hover:border-cyan-200",
                    isUploadingBanner ? "opacity-80" : "",
                  ].join(" ")}
                >
                  <span className="block text-sm font-semibold text-slate-900">
                    {isUploadingBanner
                      ? "Preparing banner..."
                      : isUploadDragActive
                        ? "Drop image to upload"
                        : "Choose an image file"}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    {isUploadDragActive
                      ? "Release the image to stage it for saving."
                      : "Drag and drop an image here, or choose a file from your device. The preview updates immediately, and the file is saved when you continue."}
                  </span>
                  <input
                    ref={uploadInputRef}
                    id="membership-banner-upload"
                    type="file"
                    accept="image/*"
                    disabled={isUploadingBanner}
                    onChange={(event) => {
                      handleUploadFiles(event.target.files);
                      event.currentTarget.value = "";
                    }}
                    className="mt-4 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-600"
                  />
                </label>

                {bannerUploadError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {bannerUploadError}
                  </div>
                ) : null}

                {isUploadingBanner ? (
                  <p className="mt-4 text-sm text-slate-500">We’re preparing the selected file now.</p>
                ) : null}
              </section>
            ) : null}

            {bannerSource === "unsplash" ? (
              <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">
                      Unsplash library
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Browse in a larger view</h2>
                    <p className="max-w-3xl text-sm leading-6 text-slate-600">
                      Open Unsplash in a modal so you can search and compare images without stretching the page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenUnsplashModal}
                    className="inline-flex rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
                  >
                    Open Unsplash library
                  </button>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      {isUnsplashModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={handleCloseUnsplashModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsplash-modal-title"
            className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">
                  Unsplash library
                </p>
                <h3 id="unsplash-modal-title" className="text-2xl font-bold tracking-tight text-slate-900">
                  Browse and choose a banner image
                </h3>
                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                  Search, filter, and select an image without expanding the main wizard page.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseUnsplashModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                aria-label="Close Unsplash library"
              >
                ×
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">
                    Search
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    Results update about 1 second after you stop typing, or instantly when you click Search or press Enter.
                  </p>
                </div>
                <div className="flex gap-3 lg:min-w-[28rem]">
                  <label className="sr-only" htmlFor="unsplash-query">
                    Search Unsplash
                  </label>
                  <input
                    ref={unsplashQueryInputRef}
                    id="unsplash-query"
                    value={unsplashQuery}
                    onChange={(event) => setUnsplashQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void searchUnsplash();
                      }
                    }}
                    placeholder="Search Unsplash photos"
                    className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  />
                  <button
                    type="button"
                    onClick={() => void searchUnsplash()}
                    disabled={isSearchingUnsplash}
                    className="rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-cyan-300"
                  >
                    {isSearchingUnsplash ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>

              <fieldset className="mt-4">
                <legend className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Orientation
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {UNSPLASH_ORIENTATION_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={[
                        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                        unsplashOrientation === option.value
                          ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="unsplash-orientation"
                        value={option.value}
                        checked={unsplashOrientation === option.value}
                        onChange={() => {
                          setUnsplashOrientation(option.value);
                          void searchUnsplash(undefined, option.value, { suppressNextDebounce: true });
                        }}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {unsplashSearchError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {unsplashSearchError}
                </div>
              ) : null}
              {bannerUploadError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {bannerUploadError}
                </div>
              ) : null}

              <div className="mt-5 min-h-0 flex-1">
                {unsplashResults.length > 0 ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <p className="mb-4 text-sm text-slate-500">
                      Showing {unsplashResults.length}
                      {unsplashTotalResults > 0 ? ` of ${unsplashTotalResults}` : ""}
                      {" "}Unsplash results for {" "}
                      <span className="font-semibold text-slate-700">{unsplashQuery.trim()}</span>
                    </p>
                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {unsplashResults.map((photo) => (
                          <UnsplashPhotoCard
                            key={photo.id}
                            photo={photo}
                            onUse={handleSelectUnsplashPhoto}
                            disabled={isUploadingBanner}
                          />
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-center">
                        {hasMoreUnsplashResults ? (
                          <button
                            type="button"
                            onClick={() => void loadMoreUnsplash()}
                            disabled={isSearchingUnsplash || isLoadingMoreUnsplash}
                            className="rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                          >
                            {isLoadingMoreUnsplash ? "Loading more..." : "Load more"}
                          </button>
                        ) : (
                          <p className="text-center text-sm text-slate-500">
                            You’ve reached the end of the Unsplash results for this search.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-white px-5 py-10 text-sm leading-6 text-slate-500">
                    Search for a photo to see curated Unsplash results here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {bannerUrl && isEditingBanner ? (
        <FilerobotImageEditor
          show={isEditingBanner}
          src={bannerUrl}
          onClose={() => closeBannerEditor()}
          onBeforeComplete={() => false}
          onComplete={(result: {
            canvas?: HTMLCanvasElement;
            imageMime?: string;
            imageName?: string;
          }) => {
            if (!result.canvas || !result.imageMime || !result.imageName) {
              return;
            }

            void completeBannerEdit({
              canvas: result.canvas,
              imageMime: result.imageMime,
              imageName: result.imageName,
            });
          }}
          config={{
            finishButtonLabel: "Apply changes",
            showGoBackBtn: true,
            tools: [
              "crop",
              "resize",
              "rotate",
              "adjust",
              "filters",
              "effects",
              "text",
              "shapes",
              "watermark",
              "image",
            ],
          }}
        />
      ) : null}
    </section>
  );
}
