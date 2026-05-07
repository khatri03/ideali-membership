import { Link } from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";
import { APP_ROUTES } from "../../routes";
import type { CustomFormDraft } from "../../types/customForms";
import { FieldPreview } from "./index";

export function CustomFormCreatePageHeader({
  isEditMode,
  loadError,
  saveError,
  isSavingForm,
  isLoadingForm,
  handleSaveForm,
  draft,
  setDraft,
  nameError,
  headerTextError,
  layoutColumnError,
}: {
  isEditMode: boolean;
  loadError: string | null;
  saveError: string | null;
  isSavingForm: boolean;
  isLoadingForm: boolean;
  handleSaveForm: () => Promise<void>;
  draft: CustomFormDraft;
  setDraft: Dispatch<SetStateAction<CustomFormDraft>>;
  nameError: string;
  headerTextError: string;
  layoutColumnError: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Custom Form Designer</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {isEditMode ? "Edit custom form" : "Design a custom form"}
          </h1>
          <p className="mt-3 text-slate-600">
            {isEditMode
              ? "Update the existing form, keep field identity stable, and publish the revised structure."
              : "Drag field types from the palette, arrange them on the canvas, and tune the constraints in the inspector."}
          </p>
        </div>

        <Link
          to={APP_ROUTES.customForms}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Back to forms list
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500">
          {loadError ? (
            <span className="text-rose-600">{loadError}</span>
          ) : saveError ? (
            <span className="text-rose-600">{saveError}</span>
          ) : (
            "Ready to save."
          )}
        </div>
        <button
          type="button"
          onClick={handleSaveForm}
          disabled={isSavingForm || isLoadingForm || Boolean(loadError)}
          className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSavingForm ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save changes" : "Create"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FieldPreview
          title="Name"
          value={draft.name}
          onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
          placeholder="Membership enrollment form"
          required
          error={nameError}
        />
        <FieldPreview
          title="Header Text"
          value={draft.headerText}
          onChange={(value) => setDraft((current) => ({ ...current, headerText: value }))}
          placeholder="Tell us a little about you"
          required
          error={headerTextError}
        />
        <FieldPreview
          title="Description"
          value={draft.description}
          onChange={(value) => setDraft((current) => ({ ...current, description: value }))}
          placeholder="Optional supporting copy"
        />
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <span>Layout Columns</span>
            <span className="text-sm font-bold leading-none text-rose-600" aria-label="Required" title="Required">
              *
            </span>
          </span>
          <select
            value={draft.layoutColumn}
            onChange={(event) => setDraft((current) => ({ ...current, layoutColumn: Number(event.target.value) }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          >
            {[1, 2, 3, 4].map((value) => (
              <option key={value} value={value}>
                {value} column{value > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          {layoutColumnError ? <p className="mt-2 text-xs font-medium text-rose-600">{layoutColumnError}</p> : null}
        </label>
      </div>
    </div>
  );
}
