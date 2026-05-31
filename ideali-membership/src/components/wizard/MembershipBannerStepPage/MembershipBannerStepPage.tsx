import { MEMBERSHIP_BANNER_CONTENT } from "./MembershipBannerStepPage.fields";
import { useMembershipBannerStep } from "./MembershipBannerStepPage.hooks";
import type { UnsplashPhoto } from "./MembershipBannerStepPage.types";

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
        <div className="space-y-2 p-4">
          <p className="line-clamp-2 text-sm font-semibold text-slate-900">{photo.description}</p>
          <p className="text-xs leading-5 text-slate-500">
            Photo by {photo.photographerName} on Unsplash
          </p>
          <a
            href={photo.photoPageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            onClick={(event) => event.stopPropagation()}
          >
            View on Unsplash
          </a>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Use this image
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
    setUnsplashQuery,
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
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6" tabIndex={-1} data-wizard-focus="true">
                <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">
                  Optional step
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">{MEMBERSHIP_BANNER_CONTENT.emptyStateTitle}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  {MEMBERSHIP_BANNER_CONTENT.emptyStateDescription}
                </p>
                <p className="mt-5 text-sm text-slate-500">{MEMBERSHIP_BANNER_CONTENT.helper}</p>
              </div>

              <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold tracking-[0.15em] text-slate-500 uppercase">
                  {MEMBERSHIP_BANNER_CONTENT.currentBannerLabel}
                </p>
                <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  {bannerUrl ? (
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white">
                        <img
                          src={bannerUrl}
                          alt={selectedUnsplashPhoto?.altDescription || "Selected membership banner"}
                          className="h-36 w-full object-cover"
                        />
                      </div>
                      <p className="break-all text-sm text-slate-700">{bannerUrl}</p>
                      {selectedUnsplashPhoto ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs leading-5 text-slate-500">
                          <span>Selected from Unsplash by {selectedUnsplashPhoto.photographerName}</span>
                          <a
                            href={selectedUnsplashPhoto.photoPageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-cyan-700 underline-offset-2 hover:underline"
                          >
                            View photo
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid h-36 place-items-center rounded-[1rem] border border-dashed border-slate-200 bg-white text-slate-400">
                        <span className="text-sm font-medium">No banner uploaded</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-500">
                        Use Skip for now to continue to Pricing, or save and exit to return later.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                    placeholder="Search people, community, abstract, finance..."
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

              <div className="mt-4 flex flex-wrap gap-2">
                {["banner", "community", "team", "abstract", "office"].map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => {
                      setUnsplashQuery(query);
                      void searchUnsplash(query, { suppressNextDebounce: true });
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
                  >
                    {query}
                  </button>
                ))}
              </div>

              {unsplashSearchError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {unsplashSearchError}
                </div>
              ) : null}

              {unsplashResults.length > 0 ? (
                <>
                  <p className="mt-5 text-sm text-slate-500">
                    Showing {unsplashResults.length}
                    {unsplashTotalResults > 0 ? ` of ${unsplashTotalResults}` : ""}
                    {" "}Unsplash results for {" "}
                    <span className="font-semibold text-slate-700">{unsplashQuery.trim()}</span>
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {unsplashResults.map((photo) => (
                      <UnsplashPhotoCard key={photo.id} photo={photo} onUse={selectUnsplashPhoto} />
                    ))}
                  </div>
                  {hasMoreUnsplashResults ? (
                    <div className="mt-5 flex items-center justify-center">
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
                    <p className="mt-5 text-center text-sm text-slate-500">
                      You’ve reached the end of the Unsplash results for this search.
                    </p>
                  )}
                </>
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
