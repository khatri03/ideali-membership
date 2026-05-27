export const MEMBERSHIP_ADVANCE_SETTINGS_STEP_NUMBER = 10;
export const MEMBERSHIP_ADVANCE_SETTINGS_NEXT_STEP_NUMBER = 11;

export const MEMBERSHIP_ADVANCE_SETTINGS_CONTENT = {
  title: "Advance Settings",
  description: "Set the optional registration window and upgrade rules for this membership plan.",
  startLabel: "Registration Start",
  endLabel: "Registration End",
  approvalLabel: "Requires Approval?",
  upgradePathsTitle: "Membership Upgrade Paths",
  upgradePathsDescription: "Configure allowed upgrade paths and charge rules.",
  upgradePathsFormTitle: "Add or update upgrade path",
  upgradePathsSourceLabel: "From membership",
  upgradePathsTargetLabel: "To membership",
  upgradePathsChargeRuleLabel: "Charge rule",
  upgradePathsFixedAmountLabel: "Fixed upgrade amount",
  upgradePathsApprovalLabel: "Requires approval",
  upgradePathsActiveLabel: "Active",
} as const;
