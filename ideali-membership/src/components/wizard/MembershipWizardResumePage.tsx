import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildMembershipWizardStepPath } from "../../routes";
import { getMembershipTitleInfo, getMembershipWizardProgress } from "../../lib/membershipWizard";
import { MEMBERSHIP_WIZARD_STEPS, type MembershipWizardStep } from "./membershipWizardSteps";

function getStepByNumber(stepNo: number): MembershipWizardStep {
  const normalizedStepNo = Math.min(Math.max(stepNo, 1), MEMBERSHIP_WIZARD_STEPS.length);
  return MEMBERSHIP_WIZARD_STEPS[normalizedStepNo - 1] ?? MEMBERSHIP_WIZARD_STEPS[0]!;
}

export function MembershipWizardResumePage() {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      return;
    }

    let isMounted = true;

    async function loadWizardState() {
      try {
        const info = await getMembershipTitleInfo(currentMembershipTypeUniqueId);
        let completedStepNo = 0;

        try {
          completedStepNo = await getMembershipWizardProgress(currentMembershipTypeUniqueId);
        } catch {
          completedStepNo = 0;
        }

        if (!isMounted) {
          return;
        }

        const nextStepNo = Math.max(info.stepNo, completedStepNo > 0 ? completedStepNo + 1 : 1);
        const step = getStepByNumber(nextStepNo);
        navigate(
          buildMembershipWizardStepPath(step.to, currentMembershipTypeUniqueId, nextStepNo),
          { replace: true },
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load membership wizard.");
      }
    }

    void loadWizardState();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, navigate]);

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-medium text-rose-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Loading membership wizard...</p>
    </section>
  );
}
