import { EditorContent } from "@tiptap/react";
import { MEMBERSHIP_THANK_YOU_EMAIL_CONTENT } from "./MembershipThankYouEmailStepPage.fields";
import { useMembershipThankYouEmailStep } from "./MembershipThankYouEmailStepPage.hook";
import { MembershipThankYouEmailToolbar } from "./MembershipThankYouEmailStepPage.toolbar";

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
  const { emailSubject, editor, error, isLoading, isSaving, placeholders, reload, setEmailSubject } =
    useMembershipThankYouEmailStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipThankYouEmailError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
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
              <label htmlFor="membership-thank-you-email-subject" className="text-sm font-semibold text-slate-800">
                Email Subject <span className="text-rose-600">*</span>
              </label>
              <input
                id="membership-thank-you-email-subject"
                type="text"
                value={emailSubject}
                onChange={(event) => setEmailSubject(event.target.value)}
                placeholder="Enter email subject"
                className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
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

            <p className="text-sm text-slate-500">{MEMBERSHIP_THANK_YOU_EMAIL_CONTENT.helper}</p>
            {isSaving ? <p className="text-sm font-medium text-cyan-700">Saving thank you email...</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
