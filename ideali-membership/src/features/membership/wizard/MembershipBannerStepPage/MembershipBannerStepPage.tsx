import { MEMBERSHIP_BANNER_CONTENT } from "./MembershipBannerStepPage.fields";
import { MembershipBannerError, MembershipBannerStepPageContent } from "./MembershipBannerStepPage.content";
import { useMembershipBannerStep } from "./MembershipBannerStepPage.hooks";

export function MembershipBannerStepPage() {
  const { bannerUrl, error, isLoading, reload } = useMembershipBannerStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipBannerError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_BANNER_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_BANNER_CONTENT.description}</p>
      </div>

      <MembershipBannerStepPageContent bannerUrl={bannerUrl} isLoading={isLoading} />
    </section>
  );
}

