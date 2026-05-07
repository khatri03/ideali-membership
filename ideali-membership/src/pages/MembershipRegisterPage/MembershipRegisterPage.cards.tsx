import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-7 w-7 fill-current">
      <path d="M10 2.5 18 17.5H2L10 2.5Zm0 4.1a.75.75 0 0 0-.75.75v4.3a.75.75 0 0 0 1.5 0v-4.3A.75.75 0 0 0 10 6.6Zm0 8.1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  );
}

export function UnavailableCard() {
  return (
    <section className="w-full max-w-lg rounded-[2rem] border border-amber-200 bg-amber-50/95 p-8 text-center shadow-xl shadow-amber-200/40 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
        <WarningIcon />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-amber-950">
        {MEMBERSHIP_REGISTER_PAGE_COPY.unavailableTitle}
      </h1>
      <p className="mt-3 text-sm leading-6 text-amber-900/80">
        {MEMBERSHIP_REGISTER_PAGE_COPY.unavailableBody}
      </p>
    </section>
  );
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="w-full max-w-lg rounded-[2rem] border border-rose-200 bg-rose-50/95 p-8 text-center shadow-xl shadow-rose-200/30 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600">
        <WarningIcon />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-rose-950">We could not load registration</h1>
      <p className="mt-3 text-sm leading-6 text-rose-900/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Try again
      </button>
    </section>
  );
}

export function SuccessCard({ message }: { message: string }) {
  return (
    <section className="w-full max-w-lg rounded-[2rem] border border-emerald-200 bg-emerald-50/95 p-8 text-center shadow-xl shadow-emerald-200/30 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-600">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-7 w-7 fill-current">
          <path d="M7.8 13.7 4.6 10.5l-1.5 1.5 4.7 4.7 9.2-9.2-1.5-1.5z" />
        </svg>
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-emerald-950">Registration submitted</h1>
      <p className="mt-3 text-sm leading-6 text-emerald-900/80">{message}</p>
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900">
        The organizer can now review the registration details.
      </div>
    </section>
  );
}

