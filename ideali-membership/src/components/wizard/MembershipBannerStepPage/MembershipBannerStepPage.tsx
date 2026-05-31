import { MEMBERSHIP_BANNER_CONTENT } from "./MembershipBannerStepPage.fields";
import { useMembershipBannerStep } from "./MembershipBannerStepPage.hooks";
import type { UnsplashOrientation, UnsplashPhoto } from "./MembershipBannerStepPage.types";

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
}: {
  photo: UnsplashPhoto;
  onUse: (photo: UnsplashPhoto) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button type="button" className="block w-full text-left" onClick={() => onUse(photo)}>
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
    error,
    isLoading,
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
    setUnsplashQuery,
    setUnsplashOrientation,
    searchUnsplash,
    loadMoreUnsplash,
    selectUnsplashPhoto,
  } = useMembershipBannerStep();

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

            {bannerUrl ? (
              <section className="rounded-[1.75rem] border border-cyan-100 bg-cyan-50/60 p-5 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">
                      Selected image preview
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Current banner selection</h2>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                      This is the image that will be saved as the banner for the membership type.
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      {getUnsplashPreviewLabel(unsplashOrientation)}
                    </p>
                  </div>
                  {selectedUnsplashPhoto ? (
                    <a
                      href={selectedUnsplashPhoto.photoPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    >
                      View on Unsplash
                    </a>
                  ) : null}
                </div>
                <div className={`mt-4 overflow-hidden rounded-[1.25rem] border border-cyan-100 bg-slate-100 p-2 ${getUnsplashPreviewAspectClass(unsplashOrientation)}`}>
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
                  {selectedUnsplashPhoto ? (
                    <p className="text-xs leading-5 text-slate-500">
                      Selected from Unsplash by {selectedUnsplashPhoto.photographerName}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">
                    Unsplash library
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Browse banner ideas</h2>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    Search Unsplash, preview a photo, and use it as the banner image for this membership type.
                  </p>
                  <p className="text-xs leading-5 text-slate-500">
                    Results update about 1 second after you stop typing, or instantly when you click Search or press Enter.
                  </p>
                </div>
                <div className="flex gap-3 md:min-w-[28rem]">
                  <label className="sr-only" htmlFor="unsplash-query">
                    Search Unsplash
                  </label>
                  <input
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

              {unsplashResults.length > 0 ? (
                <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                  <p className="text-sm text-slate-500">
                    Showing {unsplashResults.length}
                    {unsplashTotalResults > 0 ? ` of ${unsplashTotalResults}` : ""}
                    {" "}Unsplash results for {" "}
                    <span className="font-semibold text-slate-700">{unsplashQuery.trim()}</span>
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {unsplashResults.map((photo) => (
                      <UnsplashPhotoCard key={photo.id} photo={photo} onUse={selectUnsplashPhoto} />
                    ))}
                  </div>
                  {hasMoreUnsplashResults ? (
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => void loadMoreUnsplash()}
                        disabled={isSearchingUnsplash || isLoadingMoreUnsplash}
                        className="rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        {isLoadingMoreUnsplash ? "Loading more..." : "Load more"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-500">
                      You’ve reached the end of the Unsplash results for this search.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-200 bg-white px-5 py-8 text-sm leading-6 text-slate-500">
                  Search for a photo to see curated Unsplash results here.
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  );
}
