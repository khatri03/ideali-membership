import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { DEFAULT_MEMBERSHIP_REGISTER_FORM } from "./MembershipRegisterPage.fields";
import { validateMembershipRegistrationForm } from "./MembershipRegisterPage.schema";
import type { MembershipRegisterPageViewModel } from "./MembershipRegisterPage.types";
import { getMembershipRegistrationInfo, submitMembershipRegistration } from "../../lib/membershipRegistration";
import type { MembershipRegistrationFormState, MembershipRegistrationInfo } from "../../types/membershipRegistration";
import { buildPaymentCurrencyPrefix, formatAmount, getPaymentMethodOptions, parseDonationAmount } from "./MembershipRegisterPage.hooks.utils";

export function useMembershipRegisterPage(): MembershipRegisterPageViewModel & {
  paymentMethodOptions: Array<{ value: number; label: string }>;
  formattedMembershipCharges: string;
  isFreeMembership: boolean;
  customFormCount: number;
  organizerName: string;
  membershipName: string;
  membershipDescription: string;
  membershipColor: string | null;
} {
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const [info, setInfo] = useState<MembershipRegistrationInfo | null>(null);
  const [form, setForm] = useState<MembershipRegistrationFormState>(DEFAULT_MEMBERSHIP_REGISTER_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof MembershipRegistrationFormState, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previousTitleRef = useRef(document.title);
  const isRegistrationUnavailable = loadError === "Membership registration is not available yet.";

  const loadInfo = useCallback(async () => {
    if (!currentMembershipTypeUniqueId) {
      setIsLoading(false);
      setLoadError("Membership type unique id is required.");
      return;
    }

    setIsLoading(true);
    setLoadError("");

    try {
      const result = await getMembershipRegistrationInfo(currentMembershipTypeUniqueId);
      setInfo(result);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load membership registration.");
    } finally {
      setIsLoading(false);
    }
  }, [currentMembershipTypeUniqueId]);

  useEffect(() => {
    let isMounted = true;

    async function loadInfoSafely() {
      if (!currentMembershipTypeUniqueId) {
        setIsLoading(false);
        setLoadError("Membership type unique id is required.");
        return;
      }

      setIsLoading(true);
      setLoadError("");

      try {
        const result = await getMembershipRegistrationInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setInfo(result);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Unable to load membership registration.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInfoSafely();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId]);

  useEffect(() => {
    return () => {
      document.title = previousTitleRef.current;
    };
  }, []);

  useEffect(() => {
    if (!info) {
      return;
    }

    setForm((current) => {
      if (current.paymentMethod) {
        return current;
      }

      const firstPaymentMethod = getPaymentMethodOptions(info)[0];
      const donationAmount = parseDonationAmount(current.donationAmount);
      const tipAmount = parseDonationAmount(current.tipAmount);
      const requiresPaymentMethod = !info.membershipDetail.isFree || donationAmount > 0 || tipAmount > 0;
      const nextPaymentMethod = requiresPaymentMethod && firstPaymentMethod ? String(firstPaymentMethod.value) : "";

      return {
        ...current,
        paymentMethod: nextPaymentMethod,
      };
    });
  }, [info, form.donationAmount, form.tipAmount]);

  const paymentMethodOptions = useMemo(() => getPaymentMethodOptions(info), [info]);

  const formattedMembershipCharges = useMemo(() => {
    return formatAmount(info?.membershipDetail.membershipCharges ?? 0, info);
  }, [info]);

  const customFormCount = info?.membershipDetail.customForms.length ?? 0;
  const isFreeMembership = Boolean(info?.membershipDetail.isFree);
  const organizerName = info?.organizerName || info?.membershipDetail.organizerName || "Membership organizer";
  const membershipName = info?.membershipDetail.name || "Membership";
  const membershipDescription = info?.membershipDetail.description || "";
  const membershipColor = info?.membershipDetail.color || null;
  const registrationState = info?.registrationState ?? "Unavailable";
  const registrationStartDateUtc = info?.registrationStartDateUtc ?? null;
  const registrationEndDateUtc = info?.registrationEndDateUtc ?? null;

  useEffect(() => {
    document.title = membershipName || "Membership";
  }, [membershipName]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!info) {
        return;
      }

      const nextErrors = validateMembershipRegistrationForm(form, info);
      setErrors(nextErrors);
      setSubmitError("");
      setSubmitMessage("");

      if (Object.keys(nextErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);

      try {
        const selectedPaymentMethod = form.paymentMethod.trim() ? Number(form.paymentMethod) : null;
        const donationAmount = parseDonationAmount(form.donationAmount);
        const tipAmount = parseDonationAmount(form.tipAmount);
        const result = await submitMembershipRegistration(
          currentMembershipTypeUniqueId,
          form,
          info.membershipDetail.membershipCharges ?? 0,
          selectedPaymentMethod,
          donationAmount,
          tipAmount,
          info.membershipDetail.donationCampaignName,
        );

        setSubmitMessage(result.message);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to submit the registration.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentMembershipTypeUniqueId, form, info],
  );

  const setField = useCallback(<T extends keyof MembershipRegistrationFormState>(field: T, value: MembershipRegistrationFormState[T]) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  }, []);

  const onRetry = useCallback(() => {
    setLoadError("");
    setIsLoading(true);
    setInfo(null);
    setSubmitError("");
    setSubmitMessage("");
    setErrors({});
    void loadInfo();
  }, [loadInfo]);

  return {
    info,
    form,
    isLoading,
    loadError,
    submitError,
    submitMessage,
    isSubmitting,
    errors,
    onSubmit: handleSubmit,
    onRetry,
    setField,
    paymentMethodOptions,
    formattedMembershipCharges,
    isFreeMembership,
    customFormCount,
    organizerName,
    membershipName,
    membershipDescription,
    membershipColor,
    registrationState,
    registrationStartDateUtc,
    registrationEndDateUtc,
    isRegistrationUnavailable,
  };
}
