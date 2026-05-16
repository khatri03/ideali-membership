import { useEffect, useState } from "react";
import type { MembershipRegisterPageViewModel, MembershipTheme } from "./MembershipRegisterPage.types";
import type { MembershipRegistrationFormState } from "../../types/membershipRegistration";
import { CountrySelectInput } from "../../components/inputs/CountrySelectInput/CountrySelectInput";
import { StateSelectInput } from "../../components/inputs/StateSelectInput/StateSelectInput";
import { PhoneInput } from "../../components/inputs/PhoneInput/PhoneInput";
import { PasswordInput } from "../../components/inputs/PasswordInput/PasswordInput";
import { fetchAddressTypeOptions, fetchContactPrefixOptions } from "../../lib/membershipRegistration";
import { ProfilePhotoField } from "./components/ProfilePhotoField";
import { getFieldBorderClass } from "./MembershipRegisterWizard.utils";
import { SectionTitle, WizardField } from "./MembershipRegisterWizard.parts";

export function YourInformationStep({
  form,
  errors,
  setField,
  theme,
  showBorders,
}: {
  form: MembershipRegistrationFormState;
  errors: Partial<Record<keyof MembershipRegistrationFormState, string>>;
  setField: MembershipRegisterPageViewModel["setField"];
  theme: MembershipTheme;
  showBorders: boolean;
}) {
  const [prefixOptions, setPrefixOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [isLoadingPrefixOptions, setIsLoadingPrefixOptions] = useState(false);
  const [addressTypeOptions, setAddressTypeOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [isLoadingAddressTypeOptions, setIsLoadingAddressTypeOptions] =
    useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingPrefixOptions(true);

    void fetchContactPrefixOptions()
      .then((options) => {
        if (isMounted) {
          setPrefixOptions(options);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPrefixOptions([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPrefixOptions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingAddressTypeOptions(true);

    void fetchAddressTypeOptions()
      .then((options) => {
        if (isMounted) {
          setAddressTypeOptions(options);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAddressTypeOptions([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAddressTypeOptions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <SectionTitle
            title="User Login"
            description="Use these details to sign in after registration."
            theme={theme}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <WizardField
              label="Email"
              theme={theme}
              error={errors.email}
              required
            >
              <input
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="name@example.com"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
              <WizardField
                label="Password"
                theme={theme}
                error={errors.password}
                required
              >
                <PasswordInput
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  placeholder="Create password"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>

              <WizardField
                label="Confirm Password"
                theme={theme}
                error={errors.confirmPassword}
                required
              >
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setField("confirmPassword", event.target.value)
                  }
                  placeholder="Confirm password"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>
            </div>
          </div>
        </div>

        <div
          className="my-6 w-full border-t border-solid"
          style={{ borderColor: theme.cardBorder }}
          aria-hidden="true"
        />

        <div className="space-y-4">
          <SectionTitle
            title="Contact Info"
            description="Share the contact details we need for your membership record."
            theme={theme}
          />

          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,8fr)]">
            <div className="lg:row-span-2 lg:h-full">
              <ProfilePhotoField
                value={form.profilePhotoFile}
                onChange={(value) => setField("profilePhotoFile", value)}
                theme={theme}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <WizardField label="Prefix" theme={theme}>
                <select
                  value={form.prefix}
                  onChange={(event) => setField("prefix", event.target.value)}
                  disabled={
                    isLoadingPrefixOptions && prefixOptions.length === 0
                  }
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                >
                  <option value="">
                    {isLoadingPrefixOptions && prefixOptions.length === 0
                      ? "Loading prefixes..."
                      : "Select prefix"}
                  </option>
                  {prefixOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </WizardField>

              <WizardField
                label="First Name"
                theme={theme}
                error={errors.firstName}
              >
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(event) =>
                    setField("firstName", event.target.value)
                  }
                  placeholder="First name"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>

              <WizardField label="Middle Name" theme={theme}>
                <input
                  type="text"
                  value={form.middleName}
                  onChange={(event) =>
                    setField("middleName", event.target.value)
                  }
                  placeholder="Middle name"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>

              <WizardField
                label="Last Name"
                theme={theme}
                error={errors.lastName}
                required
              >
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(event) => setField("lastName", event.target.value)}
                  placeholder="Last name"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>

              <WizardField
                label="Cell Phone"
                theme={theme}
                error={errors.cellPhone}
              >
                <PhoneInput
                  value={form.cellPhone}
                  onChange={(value) => setField("cellPhone", value)}
                  placeholder="(555) 123-4567"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>
            </div>
          </div>
        </div>

        <div
          className="my-6 w-full border-t border-solid"
          style={{ borderColor: theme.cardBorder }}
          aria-hidden="true"
        />

        <div className="space-y-4">
          <SectionTitle
            title="Address"
            description="Add an address if you want one attached to your membership record."
            theme={theme}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <WizardField
              label="Address Type"
              theme={theme}
              error={errors.addressType}
              required
            >
              <select
                value={form.addressType}
                onChange={(event) =>
                  setField("addressType", event.target.value)
                }
                disabled={
                  isLoadingAddressTypeOptions && addressTypeOptions.length === 0
                }
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              >
                <option value="">
                  {isLoadingAddressTypeOptions &&
                  addressTypeOptions.length === 0
                    ? "Loading address types..."
                    : "Select address type"}
                </option>
                {addressTypeOptions.map((option) => (
                  <option
                    key={option.value || "placeholder"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </WizardField>

            <WizardField label="Country List" theme={theme}>
              <CountrySelectInput
                value={form.countryId}
                onChange={(value) => {
                  setField("countryId", value);
                  setField("stateId", "");
                }}
                placeholder="Select country"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <WizardField label="State List" theme={theme}>
              <StateSelectInput
                countryId={form.countryId}
                value={form.stateId}
                onChange={(value) => setField("stateId", value)}
                placeholder="Select state"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <WizardField
              label="Line 1"
              theme={theme}
              error={errors.streetLine1}
              required
            >
              <input
                type="text"
                value={form.streetLine1}
                onChange={(event) =>
                  setField("streetLine1", event.target.value)
                }
                placeholder="Line 1"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <WizardField label="Line 2" theme={theme}>
              <input
                type="text"
                value={form.streetLine2}
                onChange={(event) =>
                  setField("streetLine2", event.target.value)
                }
                placeholder="Line 2"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <WizardField label="City" theme={theme}>
              <input
                type="text"
                value={form.cityName}
                onChange={(event) => setField("cityName", event.target.value)}
                placeholder="City"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <WizardField label="Zip/Postal Code" theme={theme}>
              <input
                type="text"
                value={form.zipCode}
                onChange={(event) => setField("zipCode", event.target.value)}
                placeholder="Zip / postal code"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>
          </div>
        </div>
      </div>
    </>
  );
}
