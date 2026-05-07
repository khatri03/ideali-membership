import { useMembershipThankYouEmailStep } from "./MembershipThankYouEmailStepPage.hooks";
import { MembershipThankYouEmailContent } from "./MembershipThankYouEmailStepPage.content";

export function MembershipThankYouEmailStepPage() {
  const {
    editor,
    error,
    isLoading,
    isSaving,
    notifyOrganizer,
    placeholders,
    otherNotificationEmails,
    reload,
    subjectEditor,
    validationErrors,
    setNotifyOrganizer,
    setOtherNotificationEmails,
  } = useMembershipThankYouEmailStep();

  return (
    <MembershipThankYouEmailContent
      editor={editor}
      error={error}
      isLoading={isLoading}
      isSaving={isSaving}
      notifyOrganizer={notifyOrganizer}
      placeholders={placeholders}
      otherNotificationEmails={otherNotificationEmails}
      reload={reload}
      subjectEditor={subjectEditor}
      validationErrors={validationErrors}
      setNotifyOrganizer={setNotifyOrganizer}
      setOtherNotificationEmails={setOtherNotificationEmails}
    />
  );
}
