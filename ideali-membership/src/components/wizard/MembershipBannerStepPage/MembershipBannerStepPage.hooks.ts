import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import {
  getMembershipBannerInfo,
  invalidateMembershipWizardBannerCache,
  saveMembershipBannerStep,
} from "../../../lib/membershipWizard";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import {
  MEMBERSHIP_BANNER_NEXT_STEP_NUMBER,
  MEMBERSHIP_BANNER_STEP_NUMBER,
} from "./MembershipBannerStepPage.fields";
import { normalizeMembershipBannerUrl } from "./MembershipBannerStepPage.schema";
import type { MembershipBannerStepState, UnsplashPhoto } from "./MembershipBannerStepPage.types";
import { searchUnsplashPhotos, type UnsplashOrientation } from "../../../lib/unsplash";

const UNSPLASH_SEARCH_DEBOUNCE_MS = 1000;

async function persistMembershipBannerStepWithFeedback({
  bannerUrl,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  bannerUrl: string | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipBannerStep(
      normalizeMembershipBannerUrl(bannerUrl),
      stepNumber,
      membershipTypeUniqueId,
    );
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save membership banner.");
  } finally {
    setIsSaving(false);
  }
}

export function useMembershipBannerStep(): MembershipBannerStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [bannerUrl, setBannerUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashOrientation, setUnsplashOrientation] = useState<UnsplashOrientation>("landscape");
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [unsplashPage, setUnsplashPage] = useState(1);
  const [unsplashTotalResults, setUnsplashTotalResults] = useState(0);
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);
  const [isLoadingMoreUnsplash, setIsLoadingMoreUnsplash] = useState(false);
  const [unsplashSearchError, setUnsplashSearchError] = useState("");
  const [selectedUnsplashPhoto, setSelectedUnsplashPhoto] = useState<UnsplashPhoto | null>(null);
  const unsplashSearchAbortControllerRef = useRef<AbortController | null>(null);
  const unsplashSearchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextUnsplashDebounceRef = useRef(false);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMembershipBanner() {
      setIsLoading(true);
      setError("");

      try {
        const info = await getMembershipBannerInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setBannerUrl(info.bannerUrl);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setBannerUrl("");
        setError(loadError instanceof Error ? loadError.message : "Unable to load membership banner.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMembershipBanner();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useEffect(() => {
    return () => {
      unsplashSearchAbortControllerRef.current?.abort();
      if (unsplashSearchDebounceTimerRef.current !== null) {
        clearTimeout(unsplashSearchDebounceTimerRef.current);
      }
    };
  }, []);

  const clearUnsplashSearchDebounce = useCallback(() => {
    if (unsplashSearchDebounceTimerRef.current !== null) {
      clearTimeout(unsplashSearchDebounceTimerRef.current);
      unsplashSearchDebounceTimerRef.current = null;
    }
  }, []);

  const mergeUnsplashResults = useCallback((existing: UnsplashPhoto[], incoming: UnsplashPhoto[]) => {
    const seen = new Set(existing.map((photo) => photo.id));
    const merged = [...existing];

    for (const photo of incoming) {
      if (!seen.has(photo.id)) {
        seen.add(photo.id);
        merged.push(photo);
      }
    }

    return merged;
  }, []);

  const executeUnsplashSearch = useCallback(async ({
    query,
    page,
    append,
    orientation,
  }: {
    query: string;
    page: number;
    append: boolean;
    orientation: UnsplashOrientation;
  }) => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setUnsplashSearchError("Enter a search term to browse Unsplash images.");
      setUnsplashResults([]);
      setUnsplashPage(1);
      setUnsplashTotalResults(0);
      setSelectedUnsplashPhoto(null);
      return;
    }

    unsplashSearchAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    unsplashSearchAbortControllerRef.current = abortController;

    setUnsplashSearchError("");
    if (append) {
      setIsLoadingMoreUnsplash(true);
    } else {
      setIsSearchingUnsplash(true);
      setUnsplashPage(1);
      setUnsplashTotalResults(0);
      setUnsplashResults([]);
      setSelectedUnsplashPhoto(null);
    }

    try {
      const response = await searchUnsplashPhotos(normalizedQuery, {
        page,
        perPage: 12,
        orientation,
        signal: abortController.signal,
      });
      setUnsplashTotalResults(response.totalResults);
      setUnsplashPage(page);
      setUnsplashResults((current) => (append ? mergeUnsplashResults(current, response.results) : response.results));
    } catch (searchError) {
      if (abortController.signal.aborted) {
        return;
      }

      if (!append) {
        setUnsplashResults([]);
        setUnsplashTotalResults(0);
      }
      setUnsplashSearchError(
        searchError instanceof Error ? searchError.message : "Unable to search Unsplash.",
      );
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearchingUnsplash(false);
        setIsLoadingMoreUnsplash(false);
      }
    }
  }, [mergeUnsplashResults]);

  useEffect(() => {
    clearUnsplashSearchDebounce();

    if (suppressNextUnsplashDebounceRef.current) {
      suppressNextUnsplashDebounceRef.current = false;
      return;
    }

    const normalizedQuery = unsplashQuery.trim();
    if (!normalizedQuery) {
      setUnsplashSearchError("");
      setUnsplashResults([]);
      setUnsplashPage(1);
      setUnsplashTotalResults(0);
      setSelectedUnsplashPhoto(null);
      return;
    }

    unsplashSearchDebounceTimerRef.current = setTimeout(() => {
      void executeUnsplashSearch({ query: normalizedQuery, page: 1, append: false, orientation: unsplashOrientation });
    }, UNSPLASH_SEARCH_DEBOUNCE_MS);
  }, [clearUnsplashSearchDebounce, executeUnsplashSearch, unsplashOrientation, unsplashQuery]);

  const searchUnsplash = useCallback(async (
    queryOverride?: string,
    orientationOverride?: UnsplashOrientation,
    options?: { suppressNextDebounce?: boolean },
  ) => {
    clearUnsplashSearchDebounce();
    suppressNextUnsplashDebounceRef.current = options?.suppressNextDebounce ?? false;

    const query = (queryOverride ?? unsplashQuery).trim();
    const orientation = orientationOverride ?? unsplashOrientation;
    await executeUnsplashSearch({ query, page: 1, append: false, orientation });
  }, [clearUnsplashSearchDebounce, executeUnsplashSearch, unsplashOrientation, unsplashQuery]);

  const loadMoreUnsplash = useCallback(async () => {
    const query = unsplashQuery.trim();
    if (!query || isSearchingUnsplash || isLoadingMoreUnsplash) {
      return;
    }

    if (unsplashResults.length >= unsplashTotalResults && unsplashTotalResults > 0) {
      return;
    }

    await executeUnsplashSearch({
      query,
      page: unsplashPage + 1,
      append: true,
      orientation: unsplashOrientation,
    });
  }, [executeUnsplashSearch, isLoadingMoreUnsplash, isSearchingUnsplash, unsplashOrientation, unsplashPage, unsplashQuery, unsplashResults.length, unsplashTotalResults]);

  const selectUnsplashPhoto = useCallback((photo: UnsplashPhoto) => {
    setSelectedUnsplashPhoto(photo);
    setBannerUrl(photo.imageUrl);
    setError("");
  }, []);

  useEffect(() => {
    setFooterActions({
      showBack: true,
      showSkip: true,
      showSaveNext: true,
      showSaveExit: true,
      skipLabel: "Skip",
      saveNextLabel: "Save & Continue",
      saveExitLabel: "Save & Exit",
      isSaving,
      onSkip: () =>
        void persistMembershipBannerStepWithFeedback({
          bannerUrl: null,
          stepNumber: MEMBERSHIP_BANNER_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardPaymentAccount,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_BANNER_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveNext: () =>
        void persistMembershipBannerStepWithFeedback({
          bannerUrl,
          stepNumber: MEMBERSHIP_BANNER_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardPaymentAccount,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_BANNER_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: () =>
        void persistMembershipBannerStepWithFeedback({
          bannerUrl,
          stepNumber: MEMBERSHIP_BANNER_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [bannerUrl, currentMembershipTypeUniqueId, navigate, isSaving, setFooterActions]);

  return {
    bannerUrl,
    error,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardBannerCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
    unsplashQuery,
    unsplashResults,
    unsplashTotalResults,
    isSearchingUnsplash,
    isLoadingMoreUnsplash,
    hasMoreUnsplashResults: unsplashTotalResults > 0 && unsplashResults.length < unsplashTotalResults,
    unsplashSearchError,
    selectedUnsplashPhoto,
    unsplashOrientation,
    setUnsplashQuery,
    setUnsplashOrientation,
    searchUnsplash,
    loadMoreUnsplash,
    selectUnsplashPhoto,
  };
}

