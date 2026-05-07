import { MEMBERSHIP_PAYMENT_ACCOUNT_CONTENT } from "./MembershipPaymentAccountStepPage.fields";
import {
  MembershipPaymentAccountEmpty,
  MembershipPaymentAccountError,
  MembershipPaymentAccountStepPageContent,
} from "./MembershipPaymentAccountStepPage.content";
import { useMembershipPaymentAccountStep } from "./MembershipPaymentAccountStepPage.hooks";

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

      {isLoading ? (
        <MembershipPaymentAccountStepPageContent
          isLoading={isLoading}
          isMethodsLoading={isMethodsLoading}
          isSaving={isSaving}
          paymentAccounts={paymentAccounts}
          paymentMethods={paymentMethods}
          selectedAccount={selectedAccount}
          selectedPaymentAccountUniqueId={selectedPaymentAccountUniqueId}
          selectedPaymentMethods={selectedPaymentMethods}
          validationError={validationError}
          onSelectPaymentAccount={selectPaymentAccount}
          onTogglePaymentMethod={togglePaymentMethod}
        />
      ) : paymentAccounts.length > 0 ? (
        <MembershipPaymentAccountStepPageContent
          isLoading={isLoading}
          isMethodsLoading={isMethodsLoading}
          isSaving={isSaving}
          paymentAccounts={paymentAccounts}
          paymentMethods={paymentMethods}
          selectedAccount={selectedAccount}
          selectedPaymentAccountUniqueId={selectedPaymentAccountUniqueId}
          selectedPaymentMethods={selectedPaymentMethods}
          validationError={validationError}
          onSelectPaymentAccount={selectPaymentAccount}
          onTogglePaymentMethod={togglePaymentMethod}
        />
      ) : (
        <div className="mt-8 max-w-5xl space-y-6">
          <MembershipPaymentAccountEmpty />
        </div>
      )}
    </section>
  );
}


