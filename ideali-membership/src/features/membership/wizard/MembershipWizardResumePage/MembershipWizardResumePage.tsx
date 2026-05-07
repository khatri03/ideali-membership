import { useParams } from "react-router-dom";

export function MembershipWizardResumePage() {
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";

  if (!currentMembershipTypeUniqueId) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-medium text-rose-600">Membership type unique id is missing.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Loading membership wizard...</p>
    </section>
  );
}
