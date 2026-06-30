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
import type {
  BannerSourceMode,
  MembershipBannerStepState,
  UnsplashPhoto,
} from "./MembershipBannerStepPage.types";
import { searchUnsplashPhotos, type UnsplashOrientation } from "../../../lib/unsplash";

const UNSPLASH_SEARCH_DEBOUNCE_MS = 1000;

async function persistMembershipBannerStepWithFeedback({
  bannerFile,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  bannerFile: File | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipBannerStep(bannerFile, stepNumber, membershipTypeUniqueId);
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
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerSource, setBannerSourceState] = useState<BannerSourceMode>("upload");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashOrientation, setUnsplashOrientation] = useState<UnsplashOrientation>("landscape");
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [unsplashPage, setUnsplashPage] = useState(1);
  const [unsplashTotalResults, setUnsplashTotalResults] = useState(0);
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);
  const [isLoadingMoreUnsplash, setIsLoadingMoreUnsplash] = useState(false);
  const [unsplashSearchError, setUnsplashSearchError] = useState("");
  const [bannerUploadError, setBannerUploadError] = useState("");
  const [bannerEditError, setBannerEditError] = useState("");
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [selectedUnsplashPhoto, setSelectedUnsplashPhoto] = useState<UnsplashPhoto | null>(null);
  const unsplashSearchAbortControllerRef = useRef<AbortController | null>(null);
  const unsplashSearchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextUnsplashDebounceRef = useRef(false);
  const bannerPreviewObjectUrlRef = useRef<string | null>(null);

  const revokeBannerPreviewObjectUrl = useCallback(() => {
    if (bannerPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(bannerPreviewObjectUrlRef.current);
      bannerPreviewObjectUrlRef.current = null;
    }
  }, []);

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
      setBannerUploadError("");
      setBannerEditError("");

      try {
        const info = await getMembershipBannerInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        revokeBannerPreviewObjectUrl();
        setBannerFile(null);
        setBannerUrl(info.bannerUrl);
        setBannerSourceState("upload");
        setSelectedUnsplashPhoto(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        revokeBannerPreviewObjectUrl();
        setBannerFile(null);
        setBannerUrl("");
        setSelectedUnsplashPhoto(null);
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
  }, [currentMembershipTypeUniqueId, reloadTick, revokeBannerPreviewObjectUrl]);

  useEffect(() => {
    return () => {
      unsplashSearchAbortControllerRef.current?.abort();
      if (unsplashSearchDebounceTimerRef.current !== null) {
        clearTimeout(unsplashSearchDebounceTimerRef.current);
      }
      if (bannerPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(bannerPreviewObjectUrlRef.current);
        bannerPreviewObjectUrlRef.current = null;
      }
    };
  }, []);

  const setBannerFileAndPreview = useCallback((file: File) => {
    revokeBannerPreviewObjectUrl();
    const previewUrl = URL.createObjectURL(file);
    bannerPreviewObjectUrlRef.current = previewUrl;
    setBannerFile(file);
    setBannerUrl(previewUrl);
  }, [revokeBannerPreviewObjectUrl]);

  const mimeTypeToExtension = useCallback((mimeType: string | null | undefined, fallbackUrl?: string) => {
    const normalizedMimeType = mimeType?.split(";")[0]?.trim().toLowerCase();

    switch (normalizedMimeType) {
      case "image/jpeg":
      case "image/jpg":
        return ".jpg";
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "image/gif":
        return ".gif";
      default: {
        if (fallbackUrl) {
          try {
            const fallbackPath = new URL(fallbackUrl).pathname;
            const match = fallbackPath.match(/\.[a-z0-9]+$/i);
            if (match?.[0]) {
              return match[0].toLowerCase();
            }
          } catch {
            return ".png";
          }
        }

        return ".png";
      }
    }
  }, []);

  const buildImageFileFromUrl = useCallback(async (imageUrl: string, fallbackName: string) => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Unable to read the selected image.");
    }

    const blob = await response.blob();
    const mimeTypeHeader = response.headers.get("content-type") || blob.type || "image/png";
    const mimeType = (mimeTypeHeader.split(";")[0] || "image/png").trim();
    const extension = mimeTypeToExtension(mimeType, imageUrl);
    return new File([blob], `${fallbackName}${extension}`, { type: mimeType });
  }, [mimeTypeToExtension]);

  const resolveBannerFileForSave = useCallback(async () => {
    if (bannerFile) {
      return bannerFile;
    }

    if (!bannerUrl) {
      return null;
    }

    const file = await buildImageFileFromUrl(bannerUrl, "membership-banner");
    setBannerFile(file);
    return file;
  }, [bannerFile, bannerUrl, buildImageFileFromUrl]);

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

  const setBannerSource = useCallback((value: BannerSourceMode) => {
    setBannerSourceState(value);
    setBannerUploadError("");
    if (value === "upload") {
      setUnsplashSearchError("");
      setSelectedUnsplashPhoto(null);
    }
  }, []);

  const clearBannerSelection = useCallback(() => {
    revokeBannerPreviewObjectUrl();
    setBannerUrl("");
    setBannerFile(null);
    setSelectedUnsplashPhoto(null);
    setBannerUploadError("");
    setBannerEditError("");
    setError("");
  }, [revokeBannerPreviewObjectUrl]);

  const openBannerEditor = useCallback(() => {
    if (!bannerUrl) {
      return;
    }

    setBannerEditError("");
    setBannerUploadError("");
    setIsEditingBanner(true);
  }, [bannerUrl]);

  const closeBannerEditor = useCallback(() => {
    setIsEditingBanner(false);
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

  const uploadBannerImage = useCallback(async (file: File) => {
    if (!file) {
      return;
    }

    setBannerSource("upload");
    setError("");
    setBannerEditError("");
    setIsUploadingBanner(true);
    setSelectedUnsplashPhoto(null);

    try {
      setBannerFileAndPreview(file);
    } catch (uploadError) {
      setBannerUploadError(
        uploadError instanceof Error ? uploadError.message : "Unable to prepare membership banner.",
      );
    } finally {
      setIsUploadingBanner(false);
    }
  }, [setBannerFileAndPreview, setBannerSource]);

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

  const selectUnsplashPhoto = useCallback(async (photo: UnsplashPhoto) => {
    setBannerSource("unsplash");
    setBannerUploadError("");
    setBannerEditError("");
    setError("");
    setIsUploadingBanner(true);

    try {
      const file = await buildImageFileFromUrl(photo.imageUrl, `unsplash-${photo.id}`);
      setSelectedUnsplashPhoto(photo);
      setBannerFileAndPreview(file);
      return true;
    } catch (importError) {
      setSelectedUnsplashPhoto(null);
      setBannerUploadError(
        importError instanceof Error ? importError.message : "Unable to prepare the selected Unsplash image.",
      );
      return false;
    } finally {
      setIsUploadingBanner(false);
    }
  }, [buildImageFileFromUrl, setBannerFileAndPreview, setBannerSource]);

  const completeBannerEdit = useCallback(async ({
    canvas,
    imageMime,
    imageName,
  }: {
    canvas: HTMLCanvasElement;
    imageMime: string;
    imageName: string;
  }) => {
    setBannerEditError("");
    try {
      const sourceBeforeEdit = bannerSource;
      const selectedPhotoBeforeEdit = selectedUnsplashPhoto;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => {
          if (!value) {
            reject(new Error("Unable to export the edited banner image."));
            return;
          }

          resolve(value);
        }, imageMime || "image/png");
      });

      const sanitizedName = imageName?.trim() || "membership-banner.png";
      const file = new File([blob], sanitizedName, {
        type: imageMime || blob.type || "image/png",
      });

      setBannerFileAndPreview(file);

      if (sourceBeforeEdit === "unsplash" && selectedPhotoBeforeEdit) {
        setBannerSource("unsplash");
        setSelectedUnsplashPhoto(selectedPhotoBeforeEdit);
      }
    } catch (editError) {
      setBannerEditError(
        editError instanceof Error ? editError.message : "Unable to save the edited banner.",
      );
    }
  }, [bannerSource, selectedUnsplashPhoto, setBannerFileAndPreview, setBannerSource]);

  const persistBannerStep = useCallback(async ({
    bannerFileToSave,
    onSuccess,
  }: {
    bannerFileToSave: File | null;
    onSuccess: (savedMembershipTypeUniqueId: string) => void | Promise<void>;
  }) => {
    await persistMembershipBannerStepWithFeedback({
      bannerFile: bannerFileToSave,
      stepNumber: MEMBERSHIP_BANNER_STEP_NUMBER,
      membershipTypeUniqueId: currentMembershipTypeUniqueId,
      setError,
      setIsSaving,
      onSuccess,
    });
  }, [currentMembershipTypeUniqueId, setError, setIsSaving]);

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
        void (async () => {
          try {
            const fileToSave = await resolveBannerFileForSave();
            await persistBannerStep({
              bannerFileToSave: fileToSave,
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
            });
          } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Unable to save membership banner.");
          }
        })(),
      onSaveNext: () =>
        void (async () => {
          try {
            const fileToSave = await resolveBannerFileForSave();
            await persistBannerStep({
              bannerFileToSave: fileToSave,
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
            });
          } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Unable to save membership banner.");
          }
        })(),
      onSaveExit: () =>
        void (async () => {
          try {
            const fileToSave = await resolveBannerFileForSave();
            await persistBannerStep({
              bannerFileToSave: fileToSave,
              onSuccess: async () => {
                navigate(APP_ROUTES.membershipTypes, { replace: true });
              },
            });
          } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Unable to save membership banner.");
          }
        })(),
    });
  }, [currentMembershipTypeUniqueId, navigate, persistBannerStep, resolveBannerFileForSave, isSaving, setFooterActions]);

  return {
    bannerUrl,
    error,
    isLoading,
    isSaving,
    bannerSource,
    isUploadingBanner,
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
    bannerUploadError,
    isEditingBanner,
    bannerEditError,
    selectedUnsplashPhoto,
    unsplashOrientation,
    setBannerSource,
    clearBannerSelection,
    setUnsplashQuery,
    setUnsplashOrientation,
    openBannerEditor,
    closeBannerEditor,
    searchUnsplash,
    completeBannerEdit,
    uploadBannerImage,
    loadMoreUnsplash,
    selectUnsplashPhoto,
  };
}

