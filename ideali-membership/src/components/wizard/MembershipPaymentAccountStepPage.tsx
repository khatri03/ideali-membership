import { useMembershipPaymentAccountStep } from "./MembershipPaymentAccountStepPage.hook";
import { MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT } from "./MembershipPaymentAccountStepPage.fields";

function MembershipPaymentAccountSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-[1.5rem] border border-slate-200 bg-slate-100" />
      ))}
    </div>
  );
}

function MembershipPaymentAccountError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

function MembershipPaymentAccountEmpty() {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
      <p className="text-base font-semibold text-slate-900">{MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT.emptyStateTitle}</p>
      <p className="mt-2 leading-6">{MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT.emptyStateDescription}</p>
    </div>
  );
}

export function MembershipPaymentAccountStepPage() {
  const {
    paymentAccounts,
    selectedPaymentAccountUniqueId,
    error,
    isLoading,
    isSaving,
    reload,
    selectPaymentAccount,
  } = useMembershipPaymentAccountStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipPaymentAccountError message={error} onRetry={reload} />
      </section>
    );
  }

  const selectedAccount = paymentAccounts.find((account) => account.uniqueId === selectedPaymentAccountUniqueId) ?? null;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT.description}
        </p>
        <p className="text-sm text-slate-500">{MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT.helper}</p>
      </div>

      <div className="mt-8 max-w-5xl space-y-4">
        {isLoading ? (
          <MembershipPaymentAccountSkeleton />
        ) : paymentAccounts.length > 0 ? (
          <>
            <fieldset className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" disabled={isLoading || isSaving}>
              {paymentAccounts.map((account) => {
                const isSelected = account.uniqueId === selectedPaymentAccountUniqueId;
                return (
                  <button
                    key={account.uniqueId}
                    type="button"
                    onClick={() => selectPaymentAccount(account.uniqueId)}
                    className={[
                      "flex min-h-28 flex-col justify-between rounded-[1.5rem] border p-4 text-left transition",
                      "focus:outline-none focus:ring-4 focus:ring-cyan-100",
                      isSelected
                        ? "border-cyan-300 bg-cyan-50/80 shadow-sm"
                        : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50",
                    ].join(" ")}
                    aria-pressed={isSelected}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{account.name}</p>
                          <p className="text-xs text-slate-500">
                            {account.stripeAccountNo ? "Stripe connected" : "Available account"}
                          </p>
                        </div>
                        <span
                          className={[
                            "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            isSelected
                              ? "border-cyan-500 bg-cyan-500"
                              : "border-slate-300 bg-white",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          {isSelected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                        </span>
                      </div>

                      {account.stripeAccountNo ? (
                        <p className="break-all text-xs leading-5 text-slate-500">
                          Account reference: {account.stripeAccountNo}
                        </p>
                      ) : null}
                    </div>

                    <p
                      className={[
                        "mt-3 text-xs font-semibold uppercase tracking-[0.18em]",
                        isSelected ? "text-cyan-700" : "text-slate-400",
                      ].join(" ")}
                    >
                      {isSelected ? "Selected" : "Choose"}
                    </p>
                  </button>
                );
              })}
            </fieldset>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT.selectedLabel}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedAccount
                  ? `${selectedAccount.name}${selectedAccount.stripeAccountNo ? ` - ${selectedAccount.stripeAccountNo}` : ""}`
                  : "Select a payment account to continue."}
              </p>
            </div>
          </>
        ) : (
          <MembershipPaymentAccountEmpty />
        )}
      </div>
    </section>
  );
}
