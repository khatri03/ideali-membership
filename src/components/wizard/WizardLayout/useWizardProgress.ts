import { useEffect, useState } from "react";
import { getMembershipWizardProgress } from "../../../lib/membershipWizard";

export function useWizardProgress(membershipTypeUniqueId: string, locationPathname: string) {
  const [completedStepNo, setCompletedStepNo] = useState(0);
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  useEffect(() => {
    if (!membershipTypeUniqueId) {
      setCompletedStepNo(0);
      setIsProgressLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      setIsProgressLoading(true);

      try {
        const progress = await getMembershipWizardProgress(membershipTypeUniqueId);
        if (isMounted) {
          setCompletedStepNo(progress);
        }
      } catch {
        if (isMounted) {
          setCompletedStepNo(0);
        }
      } finally {
        if (isMounted) {
          setIsProgressLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [membershipTypeUniqueId, locationPathname]);

  return { completedStepNo, isProgressLoading };
}
