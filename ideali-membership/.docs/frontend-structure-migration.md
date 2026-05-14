# Frontend Structure Migration Plan

This document maps the current React frontend into a cleaner feature-first structure without changing runtime behavior.

## Goal

Move the app toward a layout where:

- `app/` owns bootstrap, providers, and routing
- `features/` owns product domains and feature-specific UI
- `shared/` owns reusable UI primitives, utilities, and types

The intent is to improve ownership, reduce coupling, and make future refactors safer.

## Target Structure

```txt
src/
  app/
    App.tsx
    main.tsx
    router/
      routes.ts
      authGuards.tsx
      lazyPages.ts
    providers/
      AuthProvider.tsx
      ToastProvider.tsx

  features/
    auth/
      components/
      hooks/
      lib/
      types/
    membership/
      components/
      pages/
      wizard/
      lib/
      types/
    custom-forms/
      components/
      pages/
      lib/
      types/

  shared/
    components/
      inputs/
      layout/
      toast/
      ErrorBoundary/
    lib/
    types/

  styles/
    index.css
```

## Current To Target Mapping

### App bootstrap and routing

- `src/main.tsx` -> `src/app/main.tsx`
- `src/App.tsx` -> `src/app/App.tsx`
- `src/routes.ts` -> `src/app/router/routes.ts`

### Auth

- `src/auth/AuthContext.tsx` -> `src/features/auth/AuthContext.tsx`
- `src/auth/authStorage.ts` -> `src/features/auth/authStorage.ts`

### Shared shell and infrastructure

- `src/components/ErrorBoundary/ErrorBoundary.tsx` -> `src/shared/components/ErrorBoundary/ErrorBoundary.tsx`
- `src/components/toast/Toast.tsx` -> `src/shared/components/toast/Toast.tsx`
- `src/components/layout/AppLayout/AppLayout.tsx` -> `src/shared/components/layout/AppLayout/AppLayout.tsx`
- `src/components/layout/SideNav/SideNav.tsx` -> `src/shared/components/layout/SideNav/SideNav.tsx`
- `src/components/layout/TopBar/TopBar.tsx` -> `src/shared/components/layout/TopBar/TopBar.tsx`
- `src/components/layout/Footer/Footer.tsx` -> `src/shared/components/layout/Footer/Footer.tsx`
- `src/components/ProtectedShell/ProtectedShell.tsx` -> `src/features/auth/components/ProtectedShell.tsx`

### Shared inputs

- `src/components/inputs/CheckboxGroupInput/CheckboxGroupInput.tsx` -> `src/shared/components/inputs/CheckboxGroupInput/CheckboxGroupInput.tsx`
- `src/components/inputs/CountrySelectInput/CountrySelectInput.tsx` -> `src/shared/components/inputs/CountrySelectInput/CountrySelectInput.tsx`
- `src/components/inputs/MultiSelectInput/MultiSelectInput.tsx` -> `src/shared/components/inputs/MultiSelectInput/MultiSelectInput.tsx`
- `src/components/inputs/PasswordInput/PasswordInput.tsx` -> `src/shared/components/inputs/PasswordInput/PasswordInput.tsx`
- `src/components/inputs/PhoneInput/PhoneInput.tsx` -> `src/shared/components/inputs/PhoneInput/PhoneInput.tsx`
- `src/components/inputs/StateSelectInput/StateSelectInput.tsx` -> `src/shared/components/inputs/StateSelectInput/StateSelectInput.tsx`

### Wizard infrastructure

- `src/components/wizard/WizardLayout/WizardLayout.tsx` -> `src/features/membership/wizard/WizardLayout.tsx`
- `src/components/wizard/WizardLayout/useWizardProgress.ts` -> `src/features/membership/wizard/useWizardProgress.ts`
- `src/components/wizard/WizardLayout/useNavVisibility.ts` -> `src/features/membership/wizard/useNavVisibility.ts`
- `src/components/wizard/WizardTopBar/WizardTopBar.tsx` -> `src/features/membership/wizard/WizardTopBar.tsx`
- `src/components/wizard/WizardSideNav/WizardSideNav.tsx` -> `src/features/membership/wizard/WizardSideNav.tsx`
- `src/components/wizard/WizardStepPage/WizardStepPage.tsx` -> `src/features/membership/wizard/WizardStepPage.tsx`
- `src/components/wizard/WizardFooterActionsContext/WizardFooterActionsContext.tsx` -> `src/features/membership/wizard/WizardFooterActionsContext.tsx`
- `src/components/wizard/WizardMembershipTitleContext/WizardMembershipTitleContext.tsx` -> `src/features/membership/wizard/WizardMembershipTitleContext.tsx`
- `src/components/wizard/membershipWizardSteps.ts` -> `src/features/membership/wizard/membershipWizardSteps.ts`

### Membership wizard step pages

- `src/components/wizard/MembershipTitleStepPage/MembershipTitleStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipTitleStepPage.tsx`
- `src/components/wizard/MembershipWizardResumePage/MembershipWizardResumePage.tsx` -> `src/features/membership/wizard/pages/MembershipWizardResumePage.tsx`
- `src/components/wizard/MembershipDescriptionStepPage/MembershipDescriptionStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipDescriptionStepPage.tsx`
- `src/components/wizard/MembershipColorStepPage/MembershipColorStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipColorStepPage.tsx`
- `src/components/wizard/MembershipBannerStepPage/MembershipBannerStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipBannerStepPage.tsx`
- `src/components/wizard/MembershipPaymentAccountStepPage/MembershipPaymentAccountStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipPaymentAccountStepPage.tsx`
- `src/components/wizard/MembershipPricingStepPage/MembershipPricingStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipPricingStepPage.tsx`
- `src/components/wizard/MembershipDiscountCouponsStepPage/MembershipDiscountCouponsStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipDiscountCouponsStepPage.tsx`
- `src/components/wizard/MembershipQuestionsStepPage/MembershipQuestionsStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipQuestionsStepPage.tsx`
- `src/components/wizard/MembershipThankYouEmailStepPage/MembershipThankYouEmailStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipThankYouEmailStepPage.tsx`
- `src/components/wizard/MembershipAdvanceSettingsStepPage/MembershipAdvanceSettingsStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipAdvanceSettingsStepPage.tsx`
- `src/components/wizard/MembershipReviewStepPage/MembershipReviewStepPage.tsx` -> `src/features/membership/wizard/pages/MembershipReviewStepPage.tsx`

### Wizard step page side files

- `src/components/wizard/MembershipTitleStepPage/MembershipTitleStepPage.types.ts` -> `src/features/membership/wizard/pages/MembershipTitleStepPage.types.ts`
- `src/components/wizard/MembershipTitleStepPage/MembershipTitleStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipTitleStepPage.fields.ts`
- `src/components/wizard/MembershipTitleStepPage/MembershipTitleStepPage.hooks.ts` -> `src/features/membership/wizard/pages/MembershipTitleStepPage.hooks.ts`
- `src/components/wizard/MembershipTitleStepPage/MembershipTitleStepPage.schema.ts` -> `src/features/membership/wizard/pages/MembershipTitleStepPage.schema.ts`

- `src/components/wizard/MembershipWizardResumePage/MembershipWizardResumePage` has no side files today.

- `src/components/wizard/MembershipDescriptionStepPage/MembershipDescriptionStepPage.types.ts` -> `src/features/membership/wizard/pages/MembershipDescriptionStepPage.types.ts`
- `src/components/wizard/MembershipDescriptionStepPage/MembershipDescriptionStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipDescriptionStepPage.fields.ts`
- `src/components/wizard/MembershipDescriptionStepPage/MembershipDescriptionStepPage.hooks.ts` -> `src/features/membership/wizard/pages/MembershipDescriptionStepPage.hooks.ts`
- `src/components/wizard/MembershipDescriptionStepPage/MembershipDescriptionStepPage.schema.ts` -> `src/features/membership/wizard/pages/MembershipDescriptionStepPage.schema.ts`

- `src/components/wizard/MembershipColorStepPage/MembershipColorStepPage.types.ts` -> `src/features/membership/wizard/pages/MembershipColorStepPage.types.ts`
- `src/components/wizard/MembershipColorStepPage/MembershipColorStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipColorStepPage.fields.ts`
- `src/components/wizard/MembershipColorStepPage/MembershipColorStepPage.hooks.ts` -> `src/features/membership/wizard/pages/MembershipColorStepPage.hooks.ts`
- `src/components/wizard/MembershipColorStepPage/MembershipColorStepPage.schema.ts` -> `src/features/membership/wizard/pages/MembershipColorStepPage.schema.ts`

- `src/components/wizard/MembershipBannerStepPage/MembershipBannerStepPage.types.ts` -> `src/features/membership/wizard/pages/MembershipBannerStepPage.types.ts`
- `src/components/wizard/MembershipBannerStepPage/MembershipBannerStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipBannerStepPage.fields.ts`
- `src/components/wizard/MembershipBannerStepPage/MembershipBannerStepPage.hooks.ts` -> `src/features/membership/wizard/pages/MembershipBannerStepPage.hooks.ts`
- `src/components/wizard/MembershipBannerStepPage/MembershipBannerStepPage.schema.ts` -> `src/features/membership/wizard/pages/MembershipBannerStepPage.schema.ts`

- `src/components/wizard/MembershipPaymentAccountStepPage/MembershipPaymentAccountStepPage.types.ts` -> `src/features/membership/wizard/pages/MembershipPaymentAccountStepPage.types.ts`
- `src/components/wizard/MembershipPaymentAccountStepPage/MembershipPaymentAccountStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipPaymentAccountStepPage.fields.ts`
- `src/components/wizard/MembershipPaymentAccountStepPage/MembershipPaymentAccountStepPage.hooks.ts` -> `src/features/membership/wizard/pages/MembershipPaymentAccountStepPage.hooks.ts`
- `src/components/wizard/MembershipPaymentAccountStepPage/MembershipPaymentAccountStepPage.schema.ts` -> `src/features/membership/wizard/pages/MembershipPaymentAccountStepPage.schema.ts`

- `src/components/wizard/MembershipPricingStepPage/MembershipPricingStepPage.types.ts` -> `src/features/membership/wizard/pages/MembershipPricingStepPage.types.ts`
- `src/components/wizard/MembershipPricingStepPage/MembershipPricingStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipPricingStepPage.fields.ts`
- `src/components/wizard/MembershipPricingStepPage/MembershipPricingStepPage.hooks.ts` -> `src/features/membership/wizard/pages/MembershipPricingStepPage.hooks.ts`
- `src/components/wizard/MembershipPricingStepPage/MembershipPricingStepPage.schema.ts` -> `src/features/membership/wizard/pages/MembershipPricingStepPage.schema.ts`

- `src/components/wizard/MembershipDiscountCouponsStepPage/MembershipDiscountCouponsStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipDiscountCouponsStepPage.fields.ts`

- `src/components/wizard/MembershipQuestionsStepPage/MembershipQuestionsStepPage.types.ts` -> `src/features/membership/wizard/pages/MembershipQuestionsStepPage.types.ts`
- `src/components/wizard/MembershipQuestionsStepPage/MembershipQuestionsStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipQuestionsStepPage.fields.ts`
- `src/components/wizard/MembershipQuestionsStepPage/MembershipQuestionsStepPage.hooks.ts` -> `src/features/membership/wizard/pages/MembershipQuestionsStepPage.hooks.ts`
- `src/components/wizard/MembershipQuestionsStepPage/MembershipQuestionsStepPage.schema.ts` -> `src/features/membership/wizard/pages/MembershipQuestionsStepPage.schema.ts`

- `src/components/wizard/MembershipThankYouEmailStepPage/MembershipThankYouEmailStepPage.types.ts` -> `src/features/membership/wizard/pages/MembershipThankYouEmailStepPage.types.ts`
- `src/components/wizard/MembershipThankYouEmailStepPage/MembershipThankYouEmailStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipThankYouEmailStepPage.fields.ts`
- `src/components/wizard/MembershipThankYouEmailStepPage/MembershipThankYouEmailStepPage.hooks.ts` -> `src/features/membership/wizard/pages/MembershipThankYouEmailStepPage.hooks.ts`
- `src/components/wizard/MembershipThankYouEmailStepPage/MembershipThankYouEmailStepPage.toolbar.tsx` -> `src/features/membership/wizard/pages/MembershipThankYouEmailStepPage.toolbar.tsx`
- `src/components/wizard/MembershipThankYouEmailStepPage/tiptapEmailComposerExtensions.ts` -> `src/features/membership/wizard/pages/tiptapEmailComposerExtensions.ts`

- `src/components/wizard/MembershipAdvanceSettingsStepPage/MembershipAdvanceSettingsStepPage.types.ts` -> `src/features/membership/wizard/pages/MembershipAdvanceSettingsStepPage.types.ts`
- `src/components/wizard/MembershipAdvanceSettingsStepPage/MembershipAdvanceSettingsStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipAdvanceSettingsStepPage.fields.ts`
- `src/components/wizard/MembershipAdvanceSettingsStepPage/MembershipAdvanceSettingsStepPage.hooks.ts` -> `src/features/membership/wizard/pages/MembershipAdvanceSettingsStepPage.hooks.ts`
- `src/components/wizard/MembershipAdvanceSettingsStepPage/MembershipAdvanceSettingsStepPage.schema.ts` -> `src/features/membership/wizard/pages/MembershipAdvanceSettingsStepPage.schema.ts`

- `src/components/wizard/MembershipReviewStepPage/MembershipReviewStepPage.fields.ts` -> `src/features/membership/wizard/pages/MembershipReviewStepPage.fields.ts`

### Membership register flow

- `src/pages/MembershipRegisterPage/MembershipRegisterPage.tsx` -> `src/features/membership/pages/register/MembershipRegisterPage.tsx`
- `src/pages/MembershipRegisterPage/MembershipRegisterPage.types.ts` -> `src/features/membership/pages/register/MembershipRegisterPage.types.ts`
- `src/pages/MembershipRegisterPage/MembershipRegisterPage.schema.ts` -> `src/features/membership/pages/register/MembershipRegisterPage.schema.ts`
- `src/pages/MembershipRegisterPage/MembershipRegisterPage.hooks.ts` -> `src/features/membership/pages/register/MembershipRegisterPage.hooks.ts`
- `src/pages/MembershipRegisterPage/MembershipRegisterPage.fields.ts` -> `src/features/membership/pages/register/MembershipRegisterPage.fields.ts`
- `src/pages/MembershipRegisterPage/MembershipRegisterWizard.tsx` -> `src/features/membership/pages/register/MembershipRegisterWizard.tsx`
- `src/pages/MembershipRegisterPage/MembershipRegisterWizard.types.ts` -> `src/features/membership/pages/register/MembershipRegisterWizard.types.ts`
- `src/pages/MembershipRegisterPage/MembershipRegisterWizard.utils.ts` -> `src/features/membership/pages/register/MembershipRegisterWizard.utils.ts`
- `src/pages/MembershipRegisterPage/MembershipRegisterWizard.customForms.ts` -> `src/features/membership/pages/register/MembershipRegisterWizard.customForms.ts`
- `src/pages/MembershipRegisterPage/components/ProfilePhotoField.tsx` -> `src/features/membership/pages/register/components/ProfilePhotoField.tsx`
- `src/pages/MembershipRegisterPage/index.ts` -> `src/features/membership/pages/register/index.ts`

- `src/pages/MembershipRegisterCountdownPage/MembershipRegisterCountdownPage.tsx` -> `src/features/membership/pages/register-countdown/MembershipRegisterCountdownPage.tsx`
- `src/pages/MembershipRegisterCountdownPage/index.ts` -> `src/features/membership/pages/register-countdown/index.ts`

### Other pages

- `src/pages/DashboardPage.tsx` -> `src/features/membership/pages/DashboardPage.tsx`
- `src/pages/MembersPage.tsx` -> `src/features/membership/pages/MembersPage.tsx`
- `src/pages/MembershipTypesPage.tsx` -> `src/features/membership/pages/MembershipTypesPage.tsx`
- `src/pages/CustomFormsPage.tsx` -> `src/features/custom-forms/pages/CustomFormsPage.tsx`
- `src/pages/CustomFormCreatePage.tsx` -> `src/features/custom-forms/pages/CustomFormCreatePage.tsx`
- `src/pages/DnDGridSortExamplePage.tsx` -> `src/features/devtools/pages/DnDGridSortExamplePage.tsx`
- `src/pages/SimplePage.tsx` -> `src/shared/components/SimplePage/SimplePage.tsx` or keep in `src/features/membership/components/SimplePage.tsx` if it remains feature-specific

### Shared library and types

- `src/lib/api.ts` -> `src/shared/lib/api.ts`
- `src/lib/parseUtils.ts` -> `src/shared/lib/parseUtils.ts`
- `src/lib/donationCampaigns.ts` -> `src/features/membership/lib/donationCampaigns.ts`
- `src/lib/customForms.ts` -> `src/features/custom-forms/lib/customForms.ts`
- `src/lib/customFormDesignerUtils.ts` -> `src/features/custom-forms/lib/customFormDesignerUtils.ts`
- `src/lib/customFormDesignerUtils.test.ts` -> `src/features/custom-forms/lib/customFormDesignerUtils.test.ts`
- `src/lib/membershipWizard.ts` -> `src/features/membership/lib/membershipWizard.ts`
- `src/lib/membershipRegistration.ts` -> `src/features/membership/lib/membershipRegistration.ts`

- `src/types/auth.ts` -> `src/shared/types/auth.ts`
- `src/types/membership.ts` -> `src/shared/types/membership.ts`
- `src/types/donation.ts` -> `src/features/membership/types/donation.ts`
- `src/types/customForms.ts` -> `src/features/custom-forms/types/customForms.ts`
- `src/types/membershipRegistration.ts` -> `src/features/membership/types/membershipRegistration.ts`

## Non-Breaking Migration Order

1. Create the new folder structure without removing the current one.
2. Add barrel exports or temporary re-export files so existing imports keep working.
3. Move shared utilities first, because they have the lowest coupling.
4. Move shared UI primitives next.
5. Move auth and layout shell code.
6. Move membership wizard code, then membership pages.
7. Move custom form code.
8. Collapse old import paths only after everything compiles and tests pass.

## Guardrails

- Keep route paths unchanged during the migration.
- Keep public registration URLs unchanged.
- Do not split a feature across old and new folders at the same time unless a re-export keeps imports stable.
- Prefer small file moves over large rewrites.
- Run TypeScript and app build checks after each migration slice.

## Recommended End State

After the migration, the codebase should read like this:

- `app/` for platform concerns
- `features/membership/` for the membership product
- `features/custom-forms/` for form builder workflows
- `features/auth/` for session and access control
- `shared/` for reusable primitives and utilities

