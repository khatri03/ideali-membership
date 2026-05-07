import { fetchCountryOptions, fetchStateOptions } from "../../../../services/customForms";
import {
  fetchAddressTypeOptions,
  fetchContactPrefixOptions,
} from "../../../../services/membershipRegistration";
import {
  buildCustomFormFieldKey,
  buildCustomQuestionKey,
  type CustomFormErrors,
  type CustomFormValue,
  type CustomFormValues,
  type CustomQuestionErrors,
  type CustomQuestionValue,
  type CustomQuestionValues,
} from "./MembershipRegisterWizard.questionnaire.helpers";
import {
  buildDummyValueForControlType,
  createDummyAvatarFile,
  getFirstOptionValue,
} from "./MembershipRegisterWizard.helpers";
import {
  getCustomFormControlType,
  getCustomQuestionControlType,
} from "./MembershipRegisterWizard.questionnaire.helpers";
import type { MembershipRegistrationFormState, MembershipRegistrationInfo } from "../../../../types/membershipRegistration";

type SetFieldFn = <T extends keyof MembershipRegistrationFormState>(field: T, value: MembershipRegistrationFormState[T]) => void;

type BuildMembershipRegisterDummyDataArgs = {
  info: MembershipRegistrationInfo;
  isFreeMembership: boolean;
  setField: SetFieldFn;
  setCustomFormValues: (values: CustomFormValues) => void;
  setCustomFormErrors: (values: CustomFormErrors) => void;
  setCustomQuestionValues: (values: CustomQuestionValues) => void;
  setCustomQuestionErrors: (values: CustomQuestionErrors) => void;
  setUserLoginErrors: (values: Partial<Record<keyof MembershipRegistrationFormState, string>>) => void;
  setCurrentStep: (updater: (value: number) => number) => void;
  visibleStepCount: number;
  hasQuestionnaireContent: boolean;
};

export async function buildMembershipRegisterDummyData({
  info,
  isFreeMembership,
  setField,
  setCustomFormValues,
  setCustomFormErrors,
  setCustomQuestionValues,
  setCustomQuestionErrors,
  setUserLoginErrors,
  setCurrentStep,
  visibleStepCount,
  hasQuestionnaireContent,
}: BuildMembershipRegisterDummyDataArgs) {
  const [nextPrefixOptions, nextAddressTypeOptions, nextCountryOptions] = await Promise.all([
    fetchContactPrefixOptions(),
    fetchAddressTypeOptions(),
    fetchCountryOptions(),
  ]);

  const nextCountryValue = getFirstOptionValue(nextCountryOptions);
  const nextStateOptions = nextCountryValue ? await fetchStateOptions(nextCountryValue) : [];
  const nextStateValue = getFirstOptionValue(nextStateOptions);
  const membershipAmount = Number(info.membershipDetail.membershipCharges ?? 0);
  const presetTips = info.presetTips ?? [];
  const seedDonationAmount = isFreeMembership ? 0 : 25;

  setField("profilePhotoFile", createDummyAvatarFile());
  setField("prefix", getFirstOptionValue(nextPrefixOptions));
  setField("firstName", "John");
  setField("middleName", "A");
  setField("lastName", "Doe");
  setField("email", "john.doe@example.com");
  setField("password", "Password123!");
  setField("confirmPassword", "Password123!");
  setField("cellPhone", "(555) 123-4567");
  setField("addressType", getFirstOptionValue(nextAddressTypeOptions));
  setField("countryId", nextCountryValue);
  setField("stateId", nextStateValue);
  setField("streetLine1", "123 Main Street");
  setField("streetLine2", "Suite 200");
  setField("zipCode", "10001");
  setField("cityName", "Sample City");
  setField("donationAmount", seedDonationAmount > 0 ? seedDonationAmount.toFixed(2) : "");
  const firstPresetTip = presetTips[0];
  setField("tipPresetPercent", firstPresetTip ? String(firstPresetTip.percent) : "");
  setField(
    "tipAmount",
    firstPresetTip ? (((membershipAmount + seedDonationAmount) * firstPresetTip.percent) / 100).toFixed(2) : "",
  );
  setField("notes", "Filled by the dummy data helper.");

  if (hasQuestionnaireContent) {
    const nextCustomFormValues = info.membershipDetail.customForms.reduce<CustomFormValues>((accumulator, form) => {
      const fields = [...form.fields].sort((left, right) => left.displayOrder - right.displayOrder);

      fields.forEach((field) => {
        const controlType = getCustomFormControlType(field.formControlTypeId);
        const key = buildCustomFormFieldKey(form.uniqueId, field.uniqueId);
        accumulator[key] = buildDummyValueForControlType(
          controlType,
          field.controlLabel,
          field.options.map((option) => ({ label: option.displayText, value: option.value })),
          field.acceptedFileTypes,
          nextCountryValue,
          nextStateValue,
        );
      });

      return accumulator;
    }, {});

    const nextCustomQuestionValues = info.membershipDetail.customQuestions.reduce<CustomQuestionValues>(
      (accumulator, question) => {
        const controlType = getCustomQuestionControlType(question.controlType);
        accumulator[buildCustomQuestionKey(question.uniqueId)] = buildDummyValueForControlType(
          controlType,
          question.label,
          question.options.map((option) => ({ label: option.displayText, value: option.value })),
          question.acceptedFileTypes,
          nextCountryValue,
          nextStateValue,
        );
        return accumulator;
      },
      {},
    );

    setCustomFormValues(nextCustomFormValues);
    setCustomQuestionValues(nextCustomQuestionValues);
    setCustomFormErrors({});
    setCustomQuestionErrors({});
  }

  setUserLoginErrors({});
  setCurrentStep(() => visibleStepCount - 1);
}

