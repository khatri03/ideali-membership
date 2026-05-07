import { useEffect, useRef } from "react";
import { useMembershipPricingStep } from "./MembershipPricingStepPage.hooks";
import { MembershipPricingContent } from "./MembershipPricingStepPage.content";
import { getMembershipPricingDays } from "./MembershipPricingStepPage.fields";

export function MembershipPricingStepPage() {
  const {
    selectedPricing,
    selectedMembershipCharges,
    selectedAnnualExpiryMode,
    selectedCustomExpiryMonth,
    selectedCustomExpiryDay,
    selectedCustomExpiryDays,
    error,
    isLoading,
    isSaving,
    reload,
    selectPricing,
    selectMembershipCharges,
    selectAnnualExpiryMode,
    selectCustomExpiryMonth,
    selectCustomExpiryDay,
    selectCustomExpiryDays,
  } = useMembershipPricingStep();

  const normalizedSelectedPricing = selectedPricing ?? 0;
  const selectedOptionDescription =
    normalizedSelectedPricing === 0 ? "Select a tenure option to see its description here." : "";
  const isAnnualSelected = normalizedSelectedPricing === 2;
  const isCustomSelected = normalizedSelectedPricing === 4;
  const isAnnualCustomSelected = selectedAnnualExpiryMode === "custom";
  const availableDays = getMembershipPricingDays(selectedCustomExpiryMonth);
  const pricingInputRef = useRef<HTMLInputElement | null>(null);
  const annualPanelClassName = [
    "overflow-hidden transition-all duration-300 ease-out",
    isAnnualSelected ? "max-h-[24rem] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2",
  ].join(" ");
  const customPanelClassName = [
    "overflow-hidden transition-all duration-300 ease-out",
    isCustomSelected ? "max-h-[14rem] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2",
  ].join(" ");

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      pricingInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  return (
    <MembershipPricingContent
      availableDays={availableDays}
      annualPanelClassName={annualPanelClassName}
      customPanelClassName={customPanelClassName}
      error={error}
      isAnnualCustomSelected={isAnnualCustomSelected}
      isAnnualSelected={isAnnualSelected}
      isCustomSelected={isCustomSelected}
      isLoading={isLoading}
      isSaving={isSaving}
      onRetry={reload}
      pricingInputRef={pricingInputRef}
      selectAnnualExpiryMode={selectAnnualExpiryMode}
      selectCustomExpiryDay={selectCustomExpiryDay}
      selectCustomExpiryDays={selectCustomExpiryDays}
      selectCustomExpiryMonth={selectCustomExpiryMonth}
      selectMembershipCharges={selectMembershipCharges}
      selectPricing={selectPricing}
      selectedCustomExpiryDay={selectedCustomExpiryDay}
      selectedCustomExpiryDays={selectedCustomExpiryDays}
      selectedCustomExpiryMonth={selectedCustomExpiryMonth}
      selectedMembershipCharges={selectedMembershipCharges}
      selectedOptionDescription={selectedOptionDescription}
      selectedPricing={normalizedSelectedPricing}
    />
  );
}
