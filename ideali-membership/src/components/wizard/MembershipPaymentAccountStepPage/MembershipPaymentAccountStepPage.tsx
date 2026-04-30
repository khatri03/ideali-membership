import { useMembershipPaymentAccountStep } from "./MembershipPaymentAccountStepPage.hooks";
import { MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT } from "./MembershipPaymentAccountStepPage.fields";

function MembershipPaymentAccountSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 w-full max-w-xl animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
      <div className="flex flex-wrap gap-2">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-8 w-28 animate-pulse rounded-full border border-slate-200 bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-[1.25rem] border border-slate-200 bg-slate-100" />
        ))}
      </div>
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
    paymentMethods,
    selectedPaymentMethods,
    error,
    validationError,
    isLoading,
    isMethodsLoading,
    isSaving,
    reload,
    selectPaymentAccount,
    togglePaymentMethod,
  } = useMembershipPaymentAccountStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipPaymentAccountError message={error} onRetry={reload} />
      </section>
    );
  }

  const selectedAccount =
    paymentAccounts.find((account) => account.uniqueId === selectedPaymentAccountUniqueId) ?? null;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT.description}
        </p>
        <p className="text-sm text-slate-500">{MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT.helper}</p>
      </div>

      <div className="mt-8 max-w-5xl space-y-6">
        {isLoading ? (
          <MembershipPaymentAccountSkeleton />
        ) : paymentAccounts.length > 0 ? (
          <>
            <fieldset className="space-y-6" disabled={isLoading || isSaving || isMethodsLoading}>
              <label className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-slate-800">
                  Payment Account <span className="text-rose-600">*</span>
                </span>
                <select
                  value={selectedPaymentAccountUniqueId}
                  onChange={(event) => selectPaymentAccount(event.target.value)}
                  data-wizard-focus="true"
                  className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="">Select payment account</option>
                  {paymentAccounts.map((account) => (
                    <option key={account.uniqueId} value={account.uniqueId}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {validationError && !selectedPaymentAccountUniqueId ? (
                  <p className="text-sm text-rose-600">{validationError}</p>
                ) : null}
              </label>

              {selectedAccount ? (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                    {selectedAccount.paymentMerchant}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {selectedAccount.paymentCurrency}
                  </span>
                  {selectedAccount.tapToPayEnabled ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Tap To Pay
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-3">
                {!selectedAccount ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                    <p className="text-base font-semibold text-slate-900">Select an account to load methods</p>
                    <p className="mt-2 leading-6">The available methods will appear here once a payment account is chosen.</p>
                  </div>
                ) : isMethodsLoading ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900">Available Payment Methods</p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[...Array(6)].map((_, index) => (
                        <div
                          key={index}
                          className="h-20 animate-pulse rounded-[1.25rem] border border-slate-200 bg-slate-100"
                        />
                      ))}
                    </div>
                  </div>
                ) : paymentMethods.length > 0 ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Available Payment Methods</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {paymentMethods.map((method) => {
                        const isSelected = selectedPaymentMethods.includes(method.value);

                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => togglePaymentMethod(method.value)}
                            className={[
                              "group flex min-h-20 items-center gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
                              isSelected
                                ? "border-cyan-300 bg-cyan-50 shadow-sm"
                                : "border-slate-300 bg-white hover:border-cyan-200 hover:bg-cyan-50/60",
                            ].join(" ")}
                            aria-pressed={isSelected}
                          >
                            <span
                              className={[
                                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                                isSelected ? "border-emerald-600 bg-emerald-600 text-white shadow-sm" : "border-slate-300 bg-white text-transparent",
                              ].join(" ")}
                              aria-hidden="true"
                            >
                              {isSelected ? (
                                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.4]">
                                  <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : null}
                            </span>

                            <div className="min-w-0 space-y-1">
                              <p className="text-base font-semibold text-slate-900">{method.text}</p>
                              </div>
                            </button>
                          );
                      })}
                    </div>
                    {validationError ? (
                      <p className="text-sm text-rose-600">{validationError}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                    <p className="text-base font-semibold text-slate-900">No payment methods available</p>
                    <p className="mt-2 leading-6">The selected payment account does not expose any supported methods.</p>
                  </div>
                )}
              </div>
            </fieldset>

          </>
        ) : (
          <MembershipPaymentAccountEmpty />
        )}
      </div>
    </section>
  );
}


