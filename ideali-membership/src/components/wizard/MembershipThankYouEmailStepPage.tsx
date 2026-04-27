import { EditorContent } from "@tiptap/react";
import { MEMBERSHIP_THANK_YOU_EMAIL_CONTENT } from "./MembershipThankYouEmailStepPage.fields";
import { useMembershipThankYouEmailStep } from "./MembershipThankYouEmailStepPage.hook";
import { MembershipThankYouEmailToolbar } from "./MembershipThankYouEmailStepPage.toolbar";
import type { MembershipTypePlaceholderGroup } from "../../types/membership";

function SelectField({
  label,
  onChange,
  groups,
  className = "",
}: {
  label: string;
  onChange: (value: string) => void;
  groups: Array<{
    label: string;
    options: Array<{ label: string; value: string; disabled?: boolean }>;
  }>;
  className?: string;
}) {
  return (
    <label className={["inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700", className].join(" ")}>
      <span className="sr-only">{label}</span>
      <select
        defaultValue=""
        onChange={(event) => {
          onChange(event.target.value);
          event.currentTarget.value = "";
        }}
        className="w-full bg-transparent text-sm outline-none"
      >
        <option value="">{label}</option>
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

function buildPlaceholderGroups(placeholders: MembershipTypePlaceholderGroup[]) {
  return placeholders.map((group) => ({
    label: group.label,
    options: group.items.map((item) => ({
      label: item.displayText || item.placeHolderText,
      value: item.displayText || item.placeHolderText,
    })),
  }));
}

function MembershipThankYouEmailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="h-12 rounded-[1.5rem] border border-slate-200 bg-slate-100 animate-pulse" />
      <div className="h-[18rem] rounded-[1.75rem] border border-slate-200 bg-slate-100 animate-pulse" />
    </div>
  );
}

function MembershipThankYouEmailError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function MembershipThankYouEmailStepPage() {
  const {
    editor,
    error,
    isLoading,
    isSaving,
    placeholders,
    reload,
    subjectEditor,
    validationErrors,
  } =
    useMembershipThankYouEmailStep();
  const subjectVariableGroups = buildPlaceholderGroups(placeholders);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      {error ? (
        <MembershipThankYouEmailError message={error} onRetry={reload} />
      ) : null}

      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_THANK_YOU_EMAIL_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_THANK_YOU_EMAIL_CONTENT.description}</p>
      </div>

      <div className="mt-8 max-w-4xl space-y-4">
        {isLoading ? (
          <MembershipThankYouEmailSkeleton />
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-800">
                  Email Subject <span className="text-rose-600">*</span>
                </label>
                <SelectField
                  label="Subject variable"
                  className="min-w-[12rem]"
                  groups={subjectVariableGroups}
                  onChange={(value) => {
                    if (!value) {
                      return;
                    }

                    subjectEditor
                      ?.chain()
                      .focus()
                      .insertContent([
                        {
                          type: "membershipPlaceholderToken",
                          attrs: { label: value },
                        },
                        { type: "text", text: " " },
                      ])
                      .run();
                  }}
                />
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100">
                <EditorContent editor={subjectEditor} />
              </div>
              {validationErrors.emailSubject ? (
                <p className="text-sm font-medium text-rose-600">{validationErrors.emailSubject}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                Email Body <span className="text-rose-600">*</span>
              </p>
              <p className="text-xs text-slate-500">Compose the thank you email body using the editor below.</p>
            </div>

            <MembershipThankYouEmailToolbar
              editor={editor}
              placeholders={placeholders}
              onInsertVariable={(value) => {
                editor
                  ?.chain()
                  .focus()
                  .insertContent([
                    {
                      type: "membershipPlaceholderToken",
                      attrs: { label: value },
                    },
                    { type: "text", text: " " },
                  ])
                  .run();
              }}
            />

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
              <EditorContent editor={editor} />
            </div>
            {validationErrors.emailBody ? (
              <p className="text-sm font-medium text-rose-600">{validationErrors.emailBody}</p>
            ) : null}

            <p className="text-sm text-slate-500">{MEMBERSHIP_THANK_YOU_EMAIL_CONTENT.helper}</p>
            {isSaving ? <p className="text-sm font-medium text-cyan-700">Saving thank you email...</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
