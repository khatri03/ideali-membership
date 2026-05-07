import { useEffect, useMemo, useState } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import type { MembershipTypePlaceholderGroup } from "../../../../types/membership";
import { MEMBERSHIP_THANK_YOU_EMAIL_CONTENT } from "./MembershipThankYouEmailStepPage.fields";
import { MembershipThankYouEmailToolbar } from "./MembershipThankYouEmailStepPage.toolbar";

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

function splitNotificationEmails(value: string) {
  return value
    .split(/[,\n]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function NotificationEmailTagsField({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [draftValue, setDraftValue] = useState("");
  const tags = useMemo(() => splitNotificationEmails(value), [value]);

  useEffect(() => {
    setDraftValue("");
  }, [value]);

  function commitTags(nextTags: string[]) {
    onChange(nextTags.join(", "));
  }

  function addDraftValue(rawValue: string) {
    const nextItems = splitNotificationEmails(rawValue);
    if (nextItems.length === 0) {
      return;
    }

    const nextTags = [...tags];
    nextItems.forEach((item) => {
      if (!nextTags.includes(item)) {
        nextTags.push(item);
      }
    });

    commitTags(nextTags);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800"
          >
            <span className="max-w-[16rem] truncate">{tag}</span>
            <button
              type="button"
              onClick={() => commitTags(tags.filter((item) => item !== tag))}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-cyan-700 transition hover:bg-cyan-100"
              aria-label={`Remove ${tag}`}
              title={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          type="text"
          value={draftValue}
          onChange={(event) => {
            const nextValue = event.target.value;

            if (nextValue.includes(",") || nextValue.includes("\n")) {
              addDraftValue(nextValue);
              setDraftValue("");
              return;
            }

            setDraftValue(nextValue);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDraftValue(draftValue);
              setDraftValue("");
              return;
            }

            if (event.key === "Backspace" && draftValue.length === 0 && tags.length > 0) {
              event.preventDefault();
              commitTags(tags.slice(0, -1));
            }
          }}
          onBlur={() => {
            addDraftValue(draftValue);
            setDraftValue("");
          }}
          className="min-w-[14rem] flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder={tags.length > 0 ? "Add another email" : "email1@example.com"}
        />
      </div>
    </div>
  );
}

export function MembershipThankYouEmailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="h-12 rounded-[1.5rem] border border-slate-200 bg-slate-100 animate-pulse" />
      <div className="h-[18rem] rounded-[1.75rem] border border-slate-200 bg-slate-100 animate-pulse" />
    </div>
  );
}

export function MembershipThankYouEmailError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function MembershipThankYouEmailContent({
  editor,
  error,
  isLoading,
  isSaving,
  notifyOrganizer,
  placeholders,
  otherNotificationEmails,
  reload,
  subjectEditor,
  validationErrors,
  setNotifyOrganizer,
  setOtherNotificationEmails,
}: {
  editor: Editor | null;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  notifyOrganizer: boolean;
  placeholders: MembershipTypePlaceholderGroup[];
  otherNotificationEmails: string;
  reload: () => void;
  subjectEditor: Editor | null;
  validationErrors: { emailBody?: string; emailSubject?: string };
  setNotifyOrganizer: (value: boolean) => void;
  setOtherNotificationEmails: (value: string) => void;
}) {
  const subjectVariableGroups = buildPlaceholderGroups(placeholders);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      {error ? <MembershipThankYouEmailError message={error} onRetry={reload} /> : null}

      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_THANK_YOU_EMAIL_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_THANK_YOU_EMAIL_CONTENT.description}</p>
      </div>

      <div className="mt-8 max-w-4xl space-y-4">
        {isLoading ? (
          <MembershipThankYouEmailSkeleton />
        ) : (
          <>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
                </div>
                <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:min-w-[18rem]">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Notify Organizer</p>
                      <p className="text-xs text-slate-500">Send a copy to the organizer.</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifyOrganizer}
                      aria-label="Toggle notify organizer"
                      onClick={() => setNotifyOrganizer(!notifyOrganizer)}
                      className={[
                        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition",
                        notifyOrganizer
                          ? "border-cyan-500 bg-cyan-500"
                          : "border-slate-300 bg-slate-200 hover:bg-slate-300",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition",
                          notifyOrganizer ? "translate-x-7" : "translate-x-1",
                        ].join(" ")}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  Other Notification Emails
                </span>
                <NotificationEmailTagsField value={otherNotificationEmails} onChange={setOtherNotificationEmails} />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter comma-separated email addresses for additional recipients.
                </p>
              </label>
            </div>

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
