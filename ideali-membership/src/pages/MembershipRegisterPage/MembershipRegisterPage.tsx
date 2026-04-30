import type { ReactNode } from "react";
import { ArrowRight, BadgeCheck, CreditCard, Mail, MapPin, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import { useMembershipRegisterPage } from "./MembershipRegisterPage.hooks";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-sm font-semibold text-slate-800">
      {children}
    </span>
  );
}

function FieldError({ message, id }: { message?: string; id: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-1 text-sm font-medium text-rose-600">
      {message}
    </p>
  );
}

function PriceBadge({ price }: { price: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-800">
      <Sparkles className="h-4 w-4" />
      {price}
    </div>
  );
}

export function MembershipRegisterPage() {
  const {
    info,
    form,
    isLoading,
    loadError,
    submitError,
    submitMessage,
    isSubmitting,
    errors,
    onSubmit,
    onRetry,
    setField,
    paymentMethodOptions,
    formattedMembershipCharges,
    isFreeMembership,
    customFormCount,
    organizerName,
    membershipName,
    membershipDescription,
  } = useMembershipRegisterPage();

  const showPaymentMethodField = Boolean(info && !info.membershipDetail.isFree);
  const formDisabled = isLoading || isSubmitting || Boolean(submitMessage);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef6fb_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-6rem] top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-4rem] top-[30rem] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Ideali Membership
            </p>
            <p className="mt-1 text-sm text-slate-500">Public registration</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <BadgeCheck className="h-4 w-4" />
            Secure enrollment
          </div>
        </header>

        <div className="grid flex-1 items-start gap-6 py-6 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-800">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                {MEMBERSHIP_REGISTER_PAGE_COPY.eyebrow}
              </div>

              <div className="mt-5 space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  {MEMBERSHIP_REGISTER_PAGE_COPY.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  {MEMBERSHIP_REGISTER_PAGE_COPY.subtitle}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <PriceBadge price={formattedMembershipCharges} />
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-cyan-600" />
                  {organizerName}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                  <CreditCard className="h-4 w-4 text-cyan-600" />
                  {customFormCount > 0 ? `${customFormCount} custom form${customFormCount > 1 ? "s" : ""}` : "No extra forms"}
                </span>
              </div>

              {membershipDescription ? (
                <p className="mt-6 max-w-3xl rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
                  {membershipDescription}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Membership",
                  value: membershipName,
                  icon: <UserRound className="h-4 w-4" />,
                },
                {
                  title: "Price",
                  value: isFreeMembership ? MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel : formattedMembershipCharges,
                  icon: <CreditCard className="h-4 w-4" />,
                },
                {
                  title: "Forms",
                  value: customFormCount > 0 ? `${customFormCount} required` : "Simple registration",
                  icon: <MapPin className="h-4 w-4" />,
                },
              ].map((item) => (
                <article key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    {item.icon}
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-500">{item.title}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                </article>
              ))}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">What happens next</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  "Share your contact and account details.",
                  "Choose a payment method if this membership is paid.",
                  "Submit the registration request and wait for confirmation.",
                ].map((item, index) => (
                  <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Registration form</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Enter your details</h2>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700">
                Public
              </span>
            </div>

            {isLoading ? (
              <div className="mt-6 space-y-4">
                <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : loadError ? (
              <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-semibold">We could not load this membership right now.</p>
                <p className="mt-2 leading-6">{loadError}</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Try again
                </button>
              </div>
            ) : submitMessage ? (
              <div className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">Registration submitted</h3>
                <p className="mt-3 text-sm leading-6 text-emerald-900/80">{submitMessage}</p>
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800">
                  Your membership request has been sent to {organizerName}.
                </div>
              </div>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={(event) => void onSubmit(event)}>
                {submitError ? (
                  <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {submitError}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <SectionLabel>First name</SectionLabel>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(event) => setField("firstName", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="First name"
                      disabled={formDisabled}
                      aria-invalid={Boolean(errors.firstName)}
                      aria-describedby={errors.firstName ? "membership-register-first-name-error" : undefined}
                    />
                    <FieldError id="membership-register-first-name-error" message={errors.firstName} />
                  </label>

                  <label className="block">
                    <SectionLabel>Middle name</SectionLabel>
                    <input
                      type="text"
                      value={form.middleName}
                      onChange={(event) => setField("middleName", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Middle name"
                      disabled={formDisabled}
                    />
                  </label>

                  <label className="block">
                    <SectionLabel>Last name</SectionLabel>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(event) => setField("lastName", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Last name"
                      disabled={formDisabled}
                      aria-invalid={Boolean(errors.lastName)}
                      aria-describedby={errors.lastName ? "membership-register-last-name-error" : undefined}
                    />
                    <FieldError id="membership-register-last-name-error" message={errors.lastName} />
                  </label>

                  <label className="block">
                    <SectionLabel>Prefix</SectionLabel>
                    <input
                      type="text"
                      value={form.prefix}
                      onChange={(event) => setField("prefix", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Mr, Ms, Dr"
                      disabled={formDisabled}
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <SectionLabel>Email address</SectionLabel>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => setField("email", event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                        placeholder="name@example.com"
                        disabled={formDisabled}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "membership-register-email-error" : undefined}
                      />
                    </div>
                    <FieldError id="membership-register-email-error" message={errors.email} />
                  </label>

                  <label className="block">
                    <SectionLabel>Cell phone</SectionLabel>
                    <input
                      type="text"
                      value={form.cellPhone}
                      onChange={(event) => setField("cellPhone", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Cell phone"
                      disabled={formDisabled}
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <SectionLabel>Password</SectionLabel>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) => setField("password", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Create a password"
                      disabled={formDisabled}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "membership-register-password-error" : undefined}
                    />
                    <FieldError id="membership-register-password-error" message={errors.password} />
                  </label>

                  <label className="block">
                    <SectionLabel>Confirm password</SectionLabel>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(event) => setField("confirmPassword", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Confirm password"
                      disabled={formDisabled}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? "membership-register-confirm-password-error" : undefined}
                    />
                    <FieldError id="membership-register-confirm-password-error" message={errors.confirmPassword} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <SectionLabel>Street line 1</SectionLabel>
                    <input
                      type="text"
                      value={form.streetLine1}
                      onChange={(event) => setField("streetLine1", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Street address"
                      disabled={formDisabled}
                      aria-invalid={Boolean(errors.streetLine1)}
                      aria-describedby={errors.streetLine1 ? "membership-register-street-line-1-error" : undefined}
                    />
                    <FieldError id="membership-register-street-line-1-error" message={errors.streetLine1} />
                  </label>

                  <label className="block">
                    <SectionLabel>Street line 2</SectionLabel>
                    <input
                      type="text"
                      value={form.streetLine2}
                      onChange={(event) => setField("streetLine2", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Suite, apartment, unit"
                      disabled={formDisabled}
                    />
                  </label>

                  <label className="block">
                    <SectionLabel>Zip code</SectionLabel>
                    <input
                      type="text"
                      value={form.zipCode}
                      onChange={(event) => setField("zipCode", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Zip code"
                      disabled={formDisabled}
                      aria-invalid={Boolean(errors.zipCode)}
                      aria-describedby={errors.zipCode ? "membership-register-zip-code-error" : undefined}
                    />
                    <FieldError id="membership-register-zip-code-error" message={errors.zipCode} />
                  </label>
                </div>

                {showPaymentMethodField ? (
                  <label className="block">
                    <SectionLabel>Payment method</SectionLabel>
                    <select
                      value={form.paymentMethod}
                      onChange={(event) => setField("paymentMethod", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      disabled={formDisabled}
                      aria-invalid={Boolean(errors.paymentMethod)}
                      aria-describedby={errors.paymentMethod ? "membership-register-payment-method-error" : undefined}
                    >
                      <option value="">Select a payment method</option>
                      {paymentMethodOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <FieldError id="membership-register-payment-method-error" message={errors.paymentMethod} />
                    <p className="mt-2 text-xs text-slate-500">
                      If you choose cheque, the payment will be recorded as offline.
                    </p>
                  </label>
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    This membership is free, so no payment method is required.
                  </div>
                )}

                <label className="block">
                  <SectionLabel>Notes</SectionLabel>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setField("notes", event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    placeholder="Optional notes for the membership team"
                    disabled={formDisabled}
                  />
                </label>

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">Amount due</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{formattedMembershipCharges}</p>
                    </div>
                    <button
                      type="submit"
                      disabled={formDisabled}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Submitting..." : "Submit registration"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
