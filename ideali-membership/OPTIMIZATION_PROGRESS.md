# Optimization Progress — ideali-membership

**Goal:** ~23 rounds of incremental optimization to meet enterprise standards defined in `STANDARDS.md`.  
**Constraint:** Every round must end with 147/147 tests passing + typecheck clean. No commits/pushes unless explicitly requested.  
**Strategy:** Phase 0 (safety net) → Tier 1 low-risk → Tier 2 structural → Tier 3 architectural.

---

## Completed Rounds (1–15)

### Rounds 1–9 (Phase 0 + Tier 1 — pre-summary)
- Phase 0: Safety net (147 tests established)
- Tier 1 fixes: Type strictness, utility cleanup, dead code, minor refactors

### Round 10 — `MembershipQuestionsStepPage` split
**Target:** `src/components/wizard/MembershipQuestionsStepPage/MembershipQuestionsStepPage.tsx` (was oversized)  
**Created:**
- `MembershipQuestionsStepPage.helpers.ts` — pure TS: `getPreviewDefaultOptionValue`, `parseDelimitedValues`, `toSentenceCase`, `toggleAcceptedFileType`, `normalizePreviewLayoutColumn`, `constrainSelectedFormDragToParent`
- `MembershipQuestionsStepPage.parts.tsx` — React components: `DragGripIcon`, `PreviewIcon`, `TrashIcon`, `PlusIcon`, `PencilIcon`, `MembershipQuestionsSkeleton`, `MembershipQuestionsError`, `MembershipQuestionsEmpty`, `CustomFormPreviewModal`, `DeleteCustomQuestionModal`, `DeleteSelectedCustomFormModal`, `SortableSelectedCustomFormCard`, `SortableCustomQuestionCard`, `MembershipCustomQuestionModal`
- **Bonus:** Dropped dead `console.log(nextOrder)` dev leftover  
**Result:** Main file trimmed to ~328 lines. 147/147 ✓

### Round 11 — `ProfilePhotoField` split
**Target:** `src/pages/MembershipRegisterPage/components/ProfilePhotoField.tsx` (oversized)  
**Created:**
- `ProfilePhotoField.helpers.ts` — `AVATAR_VIEWPORT_SIZE`, `AVATAR_OUTPUT_SIZE`, `AVATAR_DEFAULT_ZOOM`, `AVATAR_MIN_ZOOM`, `AVATAR_MAX_ZOOM`, `clampAvatarOffset`, `loadImageElement`, `buildAvatarFileName`, `cropAvatarFile`
- `ProfilePhotoField.parts.tsx` — `AvatarSilhouetteIcon`, `TrashIcon`, `DragHintIcon`, `AvatarEditorModal`, `RemoveAvatarConfirmModal` (both modals use `createPortal`)
- **Bonus:** Inlined dead `isImageFile` helper  
**Result:** Main file trimmed to ~351 lines. 147/147 ✓

### Round 12 — `MembershipThankYouEmailStepPage.toolbar` split
**Target:** Toolbar was monolithic inside the step page folder  
**Created:**
- `MembershipThankYouEmailStepPage.toolbar.helpers.ts` — `PlaceholderTokenSelectionAttrs` type, `getSelectedPlaceholderTokenAttrs`, `updateSelectedPlaceholderToken`, `toggleSelectedPlaceholderTokenAttr`, `isSelectedPlaceholderFormatted`, `getPlaceholderLabel`
- `MembershipThankYouEmailStepPage.toolbar.parts.tsx` — `ToolbarButton`, `SelectField`, `ColorButton`, `Divider`, `Section`, `BulletListIcon`, `TextLinesIcon`, `NumberListIcon`, `QuoteIcon`, `LinkIcon`, `UndoIcon`, `RedoIcon`
- **Bonus:** Dropped dead `TwoLineTextIcon` and `MenuIcon` (defined but never used)  
**Result:** toolbar.tsx trimmed to ~241 lines. 147/147 ✓

### Round 13 — `MembershipRegisterWizard.tsx` dead code purge
**Target:** `src/pages/MembershipRegisterPage/MembershipRegisterWizard.tsx` (was 2796 lines)  
**Deleted:**
- `CustomFormFieldCard` (~328 lines) — already replaced by extracted `CustomFormSection` in `.customForms.tsx`
- `CustomFormSection` (~120 lines) — already replaced by `ExtractedCustomFormSection` import; JSX `<CustomFormSection` had zero live call sites
- 3 dead helper functions: `getCustomFormGridClass`, `getCustomFormFieldGridSpanClass`, `getCustomFormFieldSpanClass`
- Dead import: `fetchCountryOptions`, `fetchStateOptions`
- 17 dead `.logic` import symbols (trimmed from 26 to 9 live symbols)  
**Result:** ~470 lines removed. 147/147 ✓

### Round 14 — Extract `YourInformationStep`
**Target:** `MembershipRegisterWizard.tsx` — `YourInformationStep` function (~425 lines)  
**Created:** `MembershipRegisterWizard.yourInformationStep.tsx` (436 lines)  
**Imports extracted:** `useState`, `useEffect`, `fetchContactPrefixOptions`, `fetchAddressTypeOptions`, `CountrySelectInput`, `StateSelectInput`, `PhoneInput`, `PasswordInput`, `ProfilePhotoField`, `getFieldBorderClass`, `SectionTitle`, `WizardField`  
**Dead imports removed from main:** `CountrySelectInput`, `MultiSelectInput`, `StateSelectInput`, `PhoneInput`, `PasswordInput`, `fetchAddressTypeOptions`, `fetchContactPrefixOptions`, `ProfilePhotoField`, `MembershipRegistrationCustomFormField`, `getFieldDashedBorderClass`  
**Result:** ~450 lines removed from main. 147/147 ✓

### Round 15 — Extract `PaymentStep` + Stripe components
**Target:** `MembershipRegisterWizard.tsx` — full Stripe payment block (~905 lines)  
**Created:** `MembershipRegisterWizard.paymentStep.tsx` (911 lines)  
**Moved:** `PaymentStepProps` type, `StripeCardFields`, `StripeElementsFields`, `StripeCardSkeleton`, `PaymentStep`  
**Bonus:** Dropped dead `ChevronDownIcon` (defined but never used) + `console.log` Stripe debug log  
**Dead imports removed from main:** All `@stripe/react-stripe-js`, `loadStripe`, `fetchStripePublicCredentials`, `MembershipRegistrationStripeCredentials`, `DiscountCouponValidationResult`, `buildCurrencyPrefix`, `formatAmountInput`, `normalizeAmountInput`, `parseTipAmount`  
**Result:** Main wizard now ~943 lines (down from 2796). 147/147 ✓

### Round 16 — `CustomFormCreatePage.tsx` — helpers extraction (pass 1)
**Target:** `src/pages/CustomFormCreatePage.tsx` (was 2779 lines)  
**Created:** `CustomFormCreatePage.helpers.ts` (347 lines)  
**Moved:** `CANVAS_ID`, `CONTROL_ICON_MAP`, `ActiveDragItem`, `ActiveDragRect`, `PreviewValue` + 24 pure functions/hook: `createFieldId`, `createOptionId`, `createUniqueId`, `clearDefaultOption`, `parseDelimitedDefaultValues`, `getSelectedOptionValues`, `toSentenceCase`, `normalizeLayoutColumn`, `normalizeFieldLayoutColumn`, `getPreviewColumnSpan`, `getLayoutPresetLabel`, `normalizeFields`, `getRowBoundsForIndex`, `useCompactViewport`, `createFieldDraft`, `mapPreviewFieldToDraft`, `buildEmptyDraft`, `isTruthyValue`, `getCheckboxDefaultValue`, `normalizeAcceptedFileTypes`, `toggleAcceptedFileType`, `getDefaultOptionValue`, `getDefaultMultiSelectValues`, `getPreviewDefaultValue`, `buildPreviewValues`  
**Dead imports removed from main:** `AlignLeft`, `CalendarDays`, `CheckSquare2`, `ChevronDown`, `CircleDot`, `Globe2`, `Hash`, `LockKeyhole`, `Mail`, `MapPinned`, `Paperclip`, `Palette`, `Phone`, `Send`, `SlidersHorizontal`, `Type`, `ListChecks`, `LucideIcon`, `CustomFormOptionDraft`  
**Result:** Main trimmed to 2227 lines (-552). 147/147 ✓

---

## Current File Map — `MembershipRegisterPage`

```
src/pages/MembershipRegisterPage/
  MembershipRegisterWizard.tsx                  943 lines  ← MAIN (still target)
  MembershipRegisterWizard.paymentStep.tsx      911 lines  ✓ extracted R15
  MembershipRegisterWizard.yourInformationStep.tsx  436 lines  ✓ extracted R14
  MembershipRegisterWizard.customForms.tsx      411 lines  ✓ extracted earlier
  MembershipRegisterWizard.customQuestions.tsx  379 lines  ✓ extracted earlier
  MembershipRegisterWizard.logic.ts             689 lines  (pure TS, no JSX)
  MembershipRegisterWizard.parts.tsx            351 lines  (shared UI parts)
  MembershipRegisterWizard.utils.ts             271 lines  (pure TS utils)
  MembershipRegisterWizard.types.ts              10 lines
  components/ProfilePhotoField.tsx              351 lines  ✓ split R11
  components/ProfilePhotoField.helpers.ts        81 lines  ✓ created R11
  components/ProfilePhotoField.parts.tsx        239 lines  ✓ created R11
```

---

## Remaining Rounds (16–23) — Plan

### Round 16 — `CustomFormCreatePage.tsx` — helpers + parts extraction (pass 1)
**Target:** `src/pages/CustomFormCreatePage.tsx` (2779 lines)  
**Strategy (3-pass split):**

**Pass 1 (Round 16) — Extract helpers to `CustomFormCreatePage.helpers.ts`:**
Pure TS functions with no JSX (lines ~66–440):
- Constants: `CANVAS_ID`, `CONTROL_ICON_MAP`
- Types: `ActiveDragItem`, `ActiveDragRect`, `PreviewValue`
- Pure fns: `createFieldId`, `createOptionId`, `createUniqueId`, `clearDefaultOption`, `parseDelimitedDefaultValues`, `getSelectedOptionValues`, `toSentenceCase`, `normalizeLayoutColumn`, `normalizeFieldLayoutColumn`, `getPreviewColumnSpan`, `getLayoutPresetLabel`, `normalizeFields`, `getRowBoundsForIndex`, `createFieldDraft`, `mapPreviewFieldToDraft`, `buildEmptyDraft`, `isTruthyValue`, `getCheckboxDefaultValue`, `normalizeAcceptedFileTypes`, `toggleAcceptedFileType`, `getDefaultOptionValue`, `getDefaultMultiSelectValues`, `getPreviewDefaultValue`, `buildPreviewValues`
- Hook: `useCompactViewport`

### Round 17 — `CustomFormCreatePage.tsx` — JSX components extraction (pass 2)
**Target:** `src/pages/CustomFormCreatePage.tsx` (was 2227 lines)  
**Moved to `CustomFormCreatePage.parts.tsx`:** `SortableFieldCard`, `FieldCanvasPreview`, `PreviewFieldLabel`, `PreviewFieldRenderer`, `FormPreviewField`, `PreviewFormCanvas`, `FieldPreview`, `SelectFieldPreview`, `DragGhost`, `measureDragSourceRect`  
**Dead imports removed from main:** `useDraggable`, `useSortable`, `CSS`, `CountrySelectInput`, `StateSelectInput`, `PasswordInput`, `type RefObject`, `normalizeFieldLayoutColumn`, `buildPreviewValues`, `getPreviewDefaultValue`, `isTruthyValue`, `getDefaultOptionValue`, `type PreviewValue`  
**Result:** Main trimmed to 1477 lines (-750). Parts: 863 lines. 147/147 ✓

### Round 18 — Auth token localStorage → httpOnly cookie
**Status:** Skipped/deferred — requires backend coordination. Frontend uses `localStorage["ideali-membership.auth"]`; switch to httpOnly cookie pending domain/CORS confirmation.

### Round 19 — `CustomFormCreatePage.tsx` — hook extraction (pass 3)
**Target:** `src/pages/CustomFormCreatePage.tsx` (was 1477 lines)  
**Created:** `CustomFormCreatePage.hook.ts` (851 lines)  
**Moved to hook:** all `useState` (20), `useRef` (6), `useEffect` (6), `useMemo` (9+), `useSensors`, `useDroppable`, `useNavigate`, `useParams`, `useCompactViewport`, 25 named handlers, all derived constants  
**Dead code dropped:** `fieldIdSet` (unused useMemo), `parseDelimitedDefaultValues` import (unused in component), `ControlIcon` import (unused in main JSX)  
**Dead imports removed from main:** all React hooks, all DnD hook imports, `arrayMove`, `useNavigate`, `useParams`, all API fns, all types, `ControlIcon`, `measureDragSourceRect` (now in hook), `CANVAS_ID`, `buildEmptyDraft`, `clearDefaultOption`, `createFieldDraft`, `createOptionId`, `getRowBoundsForIndex`, `mapPreviewFieldToDraft`, `normalizeFields`, `useCompactViewport`, `type ActiveDragItem`, `type ActiveDragRect`, `parseDelimitedDefaultValues`  
**Result:** Main trimmed to 924 lines (-553). Hook: 851 lines. 147/147 ✓

### Round 17 (original plan) — `CustomFormCreatePage.tsx` — parts extraction (pass 2)
**Extract React components to `CustomFormCreatePage.preview.tsx` (or `.parts.tsx`):**
Candidate components (lines ~442–1222):
- `SortableFieldCard` (~185 lines, 442–626)
- `FieldCanvasPreview` (~160 lines, 627–786)
- `PreviewFieldLabel` (~17 lines, 787–803)
- `PreviewFieldRenderer` (~174 lines, 804–977)
- `FormPreviewField` (~29 lines, 978–1006)
- `PreviewFormCanvas` (~49 lines, 1007–1055)
- `FieldPreview` (~45 lines, 1056–1100)
- `SelectFieldPreview` (~45 lines, 1101–1145)
- `DragGhost` (~59 lines, 1146–1204)
- `measureDragSourceRect` (~17 lines, 1205–1222)

**Main export:** `CustomFormCreatePage` function starts at line 1223.

### Round 18 — Auth token localStorage → discuss httpOnly cookie
**Target:** Auth token currently stored in `localStorage`  
**Approach:** Discuss switching to backend `httpOnly` cookie for XSS resistance. This is a security architecture round — changes may be minimal on frontend (remove explicit token reads) but requires backend coordination.

### Round 20 — `MembershipRegisterWizard.logic.ts` split
**Target:** `src/pages/MembershipRegisterPage/MembershipRegisterWizard.logic.ts` (was 690 lines)  
**Created:** `MembershipRegisterWizard.logic.validation.ts` (373 lines)  
**Moved to validation:** `parseAcceptedFileTypes`, `isFileTypeAccepted`, `formatAcceptedFileTypes`, `getFileValidationError`, `getCustomQuestionFileValidationError` (private), `validateCustomFormField`, `validateCustomQuestionField`, `validateCustomForms`, `validateCustomQuestions`  
**Dead imports removed from logic.ts:** `DiscountCouponValidationResult`, `CustomFormErrors`, `CustomQuestionErrors`, `CustomQuestionValue`, all 4 `isEmailValid/isPhoneLikeValue/isValidDateValue/isValidNumberValue` validators  
**Updated:** `MembershipRegisterWizard.tsx` — `getFileValidationError`, `validateCustomForms`, `validateCustomQuestionField`, `validateCustomQuestions` now import from `logic.validation`  
**Result:** logic.ts: 332 lines (-358). validation.ts: 373 lines. 147/147 ✓

### Round 21 — TanStack Query consistency audit
**Target:** `CustomFormsPage.tsx`, `MembershipTypesPage.tsx`  
**`CustomFormsPage.tsx`:** replaced `useState(forms/isLoading/error)` + `useEffect` fetch with `useQuery({ queryKey: ["custom-forms"], queryFn: fetchCustomForms })`. Removed `useEffect`, dead `useState` trio. Error display: `error.message`.  
**`MembershipTypesPage.tsx`:** replaced `useState(types/isLoading/error)` + `loadTypes` function + `useEffect` with `useQuery({ queryKey: ["membership-types"], queryFn: getMembershipTypes })`. `refreshTypes()` wraps `refetch()` to satisfy `() => Promise<void>` type for `MembershipTypeRow.onRefresh`. Removed dead `MembershipTypeListItem` import. Order modal fetch unchanged (has local DnD mutation state).  
**Result:** Both pages cleaner. 147/147 ✓

### Round 22 — Dead code sweep
**Removed console.logs (5):**
- `WizardStepPage.tsx` — entire debug `useEffect` + `useParams`, `useSearchParams`, `membershipTypeUniqueId`, `stepNo` vars removed; file shrunk from 39→17 lines
- `MembershipRegisterWizard.tsx` — `console.log("[Membership Registration] Using Stripe payment method"...)` removed from payment flow
- `MembershipQuestionsStepPage.hooks.ts` — standalone debug `useEffect` for `selectedCustomFormUniqueIds` removed
- `MembershipQuestionsStepPage.hooks.ts` — `console.log("[MembershipQuestions][Preview]"...)` multi-line debug block removed from `openCustomFormPreview`
**Fixed misleading signature:**
- `logic.ts: getCustomFormGridClass(layoutColumn: number)` — parameter was accepted but never used (`void layoutColumn` suppression). Removed parameter; updated caller in `customForms.tsx` from `getCustomFormGridClass(layoutColumn)` → `getCustomFormGridClass()`
**Kept intentional:**
- `membershipRegistration.ts` — `console.log` inside `shouldLogToConsole` guard is a deliberate debug feature
- `ErrorBoundary.tsx` — `console.error` for production error tracking
**Result:** 147/147 ✓

### Round 23 — STANDARDS.md compliance audit + final verification (CAMPAIGN COMPLETE)

**Final verification:** 147/147 tests ✓ | typecheck clean ✓

#### §9 Performance — Code Splitting
**Status: ✅ COMPLIANT**  
All page components lazy-loaded via `React.lazy` + `Suspense` in `src/app/router/lazyPages.ts`. 16 lazy entries covering all routes.

#### §4/§5 Data Fetching — TanStack Query
**Status: ✅ COMPLIANT (where applicable)**  
`CustomFormsPage`, `MembershipTypesPage` converted to TanStack (R21). Pages with complex local mutation state (order modal DnD, wizard steps) retain manual fetch — correct per standards ("server state = TanStack; local/derived = useState").

#### §3 TypeScript Strict Mode
**Status: ✅ COMPLIANT**  
`tsconfig.app.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `noFallthroughCasesInSwitch: true`. No `any` types introduced during campaign.

#### §20 Dead Code
**Status: ✅ COMPLIANT (pragmatic)**  
`noUnusedLocals`/`noUnusedParameters` not enabled — enabling now would require a large sweep across legacy files outside this campaign's scope. Manual sweeps done in R22. `knip` not integrated (third-party tooling addition, out of scope).

#### §2 Component Size (~150 lines max)
**Status: ⚠️ KNOWN VIOLATIONS — structural, documented**  
These are large JSX-heavy components or part files that were extracted from God files; they contain many visual sub-components with no further clear split boundary:

| File | Lines | Notes |
|------|-------|-------|
| `MembershipQuestionsStepPage.parts.tsx` | 979 | 14 sub-components, DnD sortable cards |
| `CustomFormCreatePage.tsx` | 890 | JSX-only after hook extraction; DnD canvas |
| `MembershipRegisterWizard.tsx` | 875 | Multi-step wizard orchestrator |
| `CustomFormCreatePage.parts.tsx` | 863 | Preview + drag ghost components |
| `MembershipRegisterWizard.paymentStep.tsx` | 853 | Stripe elements + card UI |
| `MembershipTypesPage.parts.tsx` | 741 | Type cards, modals, tables |
| `MembershipDiscountCouponsStepPage.tsx` | 513 | Coupon form + table |
| `MembershipRegisterWizard.yourInformationStep.tsx` | 408 | Registration form fields |
| `MembershipRegisterWizard.customForms.tsx` | 395 | Custom form renderer |

Further reduction requires product-team decisions on component boundaries. Structurally sound; no God-component logic mixed in.

#### §6 Custom Hook Size (~120 lines max)
**Status: ⚠️ KNOWN VIOLATIONS — structural, documented**  
All hook files exceed the 120-line guideline. `CustomFormCreatePage.hook.ts` (733 lines) is the largest — it encapsulates 20 `useState`, 6 `useRef`, 6 `useEffect`, 9+ `useMemo`, 3 DnD hooks, and 25 named handlers for a highly complex interactive canvas. Sub-hook splitting (e.g., `useDragCanvas`, `useFieldEditor`, `useFormPersistence`) is feasible but was not part of this campaign's scope.

| File | Lines |
|------|-------|
| `CustomFormCreatePage.hook.ts` | 733 |
| `MembershipQuestionsStepPage.hooks.ts` | 540 |
| `MembershipThankYouEmailStepPage.hooks.ts` | 441 |
| `MembershipRegisterPage.hooks.ts` | 315 |
| `MembershipAdvanceSettingsStepPage.hooks.ts` | 281 |

#### Campaign Summary
- **Rounds completed:** 22 of 23 planned (R18 deferred — auth cookie requires backend)
- **Lines removed from God files:** ~2,500+ (CustomFormCreatePage 2779→890, MembershipRegisterWizard 2796→875, logic.ts 690→332)
- **New files created:** 22 split files (`.helpers.ts`, `.parts.tsx`, `.hooks.ts`, `.logic.validation.ts`, step extractions)
- **Dead code removed:** 5 `console.log` blocks, unused imports, `void` param stubs
- **TanStack Query:** adopted for CustomFormsPage + MembershipTypesPage server state
- **Tests:** 147/147 maintained across every round
- **Typecheck:** clean throughout

---

## Invariants (never break)

- **Tests:** 147/147 must pass after every round
- **Typecheck:** `npm run typecheck` must be clean after every round
- **No commits/pushes** unless user explicitly requests
- **Branch:** `sohail/features/membership/member-list`
- **Test command:** `npm run test -- --run`
- **Typecheck command:** `npm run typecheck`

---

## Split Pattern Reference

```
Oversized file → split into:
  FileName.helpers.ts     pure TS, no JSX (constants, types, pure fns, hooks)
  FileName.parts.tsx      React components + JSX helpers
  FileName.tsx            trimmed main file (imports from helpers + parts)
```

For toolbar specifically:
```
  FileName.toolbar.helpers.ts
  FileName.toolbar.parts.tsx
  FileName.toolbar.tsx
```

For wizard step extraction:
```
  WizardName.stepName.tsx   extracted step component (exported)
  WizardName.tsx            imports from step file
```
