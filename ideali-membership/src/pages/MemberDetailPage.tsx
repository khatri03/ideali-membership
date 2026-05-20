import { createPortal } from "react-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Building2, CheckCircle2, CircleX, Download, ExternalLink, FileText, Globe2, Hash, Home, Image, Landmark, Mail, MapPinned, Phone, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Box, Button, Flex, Grid, Heading, HStack, Input, SimpleGrid, Stack, Text, Textarea } from "@chakra-ui/react";
import { APP_ROUTES } from "../routes";
import { downloadBinaryFile, openBinaryFile } from "../lib/api";
import { cn } from "../lib/utils";
import { fetchCountryOptions, fetchStateOptions } from "../lib/customForms";
import { EmptyStatePanel, DetailPanel, StatCard, StatusPill } from "./MemberDetailPage.parts";
import { useMemberDetailPage } from "./MemberDetailPage.hooks";
import { getCustomFormControlType, getCustomQuestionControlType } from "./MembershipRegisterPage/MembershipRegisterWizard.logic";
import type { MembershipMemberCustomFormAnswer, MembershipMemberCustomQuestionAnswer } from "../types/membership";
import type {
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomQuestion,
  MembershipRegistrationCustomQuestionOption,
} from "../types/membershipRegistration";

type MemberTone = "slate" | "cyan" | "emerald" | "amber" | "rose";
type ModerationAction = "approve" | "reject";
const MEMBER_DETAIL_TAB_ID = "member-detail";

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeStatusValue(value: string) {
  return value.replace(/[\s_-]+/g, "").toLowerCase();
}

function normalizeControlType(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getStatusTone(status: string): MemberTone {
  switch (normalizeStatusValue(status)) {
    case "active":
      return "emerald";
    case "pendingapproval":
    case "pending":
      return "amber";
    case "expired":
      return "rose";
    case "inactive":
    case "nearexpiry":
      return "cyan";
    default:
      return "slate";
  }
}

function getAddressFieldIcon(fieldLabel: string) {
  switch (fieldLabel) {
    case "Type":
      return <Home size={16} />;
    case "Address Line 1":
      return <MapPinned size={16} />;
    case "Address Line 2":
      return <FileText size={16} />;
    case "City":
      return <Building2 size={16} />;
    case "State":
      return <Landmark size={16} />;
    case "Country":
      return <Globe2 size={16} />;
    case "Zip/Postal Code":
      return <Hash size={16} />;
    default:
      return <FileText size={16} />;
  }
}

function getCustomFormFieldGridColumn(layoutColumn: number, fieldLayoutColumn: number | null) {
  const resolvedLayoutColumn = Math.max(1, Math.min(4, fieldLayoutColumn ?? layoutColumn));

  switch (resolvedLayoutColumn) {
    case 2:
      return { base: "span 1", md: "span 6" };
    case 3:
      return { base: "span 1", md: "span 6", lg: "span 4" };
    case 4:
      return { base: "span 1", md: "span 6", lg: "span 3" };
    default:
      return { base: "span 1", md: "span 12" };
  }
}

function parseSelectedValues(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall through to the delimiter-based parser below.
    }
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function MemberDetailPage() {
  const [activeDetailTabId, setActiveDetailTabId] = useState<string>(MEMBER_DETAIL_TAB_ID);
  const [pendingModerationAction, setPendingModerationAction] = useState<ModerationAction | null>(null);
  const {
    member,
    memberUniqueId,
    fullName,
    statCards,
    customFormSections,
    customQuestionResponses,
    addressFields,
    membershipExpiryLabel,
    membershipStartLabel,
    isPendingApproval,
    isUpdatingMembershipStatus,
    updateMembershipStatus,
    isLoading,
    error,
    refetch,
  } =
    useMemberDetailPage();

  useEffect(() => {
    const availableTabIds = [MEMBER_DETAIL_TAB_ID, ...customFormSections.map((section) => section.id)];
    const hasCurrentTab = availableTabIds.includes(activeDetailTabId);
    const nextActiveTabId = hasCurrentTab ? activeDetailTabId : MEMBER_DETAIL_TAB_ID;

    if (nextActiveTabId !== activeDetailTabId) {
      setActiveDetailTabId(nextActiveTabId);
    }
  }, [activeDetailTabId, customFormSections]);

  const activeCustomFormSection = useMemo(
    () => customFormSections.find((section) => section.id === activeDetailTabId) ?? null,
    [activeDetailTabId, customFormSections],
  );

  const isMemberDetailTabActive = activeDetailTabId === MEMBER_DETAIL_TAB_ID;
  const moderationModalAction = pendingModerationAction;

  async function confirmModerationAction() {
    if (!moderationModalAction) {
      return;
    }

    const succeeded = await updateMembershipStatus(moderationModalAction);
    if (succeeded) {
      setPendingModerationAction(null);
    }
  }

  if (error && !memberUniqueId) {
    return (
      <Box rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="app.panel">
        <Box rounded="app.card" borderWidth="1px" borderColor="rose.200" bg="rose.50" px={4} py={4} color="rose.700">
          {error}
        </Box>
      </Box>
    );
  }

  return (
    <Stack gap={6}>
      <Box position="relative" overflow="hidden" rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="app.panel">
        <Box position="absolute" insetY={0} right={0} display={{ base: "none", lg: "block" }} w="1/3" bgGradient="linear(to-l, brand.50, app.surface)" />
        <Flex position="relative" direction={{ base: "column", lg: "row" }} gap={6} align="start" justify="space-between">
          <Stack gap={4} maxW="3xl">
            <Link to={APP_ROUTES.membershipMembers}>
              <Button
                type="button"
                variant="outline"
                rounded="full"
                borderColor="app.border"
                bg="app.surface"
                color="app.text"
                px={4}
                py={2}
                fontSize="sm"
                fontWeight="semibold"
                gap={2}
                _hover={{ borderColor: "brand.200", bg: "brand.50", color: "brand.800" }}
              >
                <ArrowLeft size={16} />
                Back to members
              </Button>
            </Link>

            <Flex direction={{ base: "column", sm: "row" }} gap={4} align={{ sm: "start" }}>
              <Box display="flex" h={{ base: "5rem", sm: "6rem" }} w={{ base: "5rem", sm: "6rem" }} flex="none" alignItems="center" justifyContent="center" overflow="hidden" rounded="full" borderWidth="1px" borderColor="brand.100" bgGradient="linear(to-br, brand.700, cyan.500)" color="white" fontSize="xl" fontWeight="semibold" shadow="0 10px 24px rgba(34, 211, 238, 0.2)">
                {member?.profile.photoUrl ? (
                  <img
                    src={member.profile.photoUrl}
                    alt={fullName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "9999px",
                    }}
                  />
                ) : (
                  getInitials(fullName)
                )}
              </Box>

              <Stack gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.24em" color="brand.700" textTransform="uppercase">
                    Member detail
                  </Text>
                  <Heading as="h1" mt={3} size={{ base: "2xl", sm: "3xl" }} letterSpacing="-0.04em" color="app.text">
                    {fullName}
                  </Heading>
                  <Text mt={3} maxW="3xl" fontSize={{ base: "sm", sm: "md" }} lineHeight="1.8" color="app.muted">
                    Review the member&apos;s profile, membership status, and submitted registration responses in one place.
                  </Text>
                </Box>
              </Stack>
            </Flex>
          </Stack>
          {isPendingApproval ? (
            <HStack flexWrap="wrap" justify="end" gap={3} ml={{ lg: "auto" }}>
              <Button
                type="button"
                onClick={() => setPendingModerationAction("approve")}
                rounded="full"
                bg="emerald.600"
                color="white"
                px={5}
                py={2.5}
                fontSize="sm"
                fontWeight="semibold"
                _hover={{ bg: "emerald.700" }}
              >
                <CheckCircle2 size={16} />
                Approve
              </Button>
              <Button
                type="button"
                onClick={() => setPendingModerationAction("reject")}
                rounded="full"
                bg="rose.600"
                color="white"
                px={5}
                py={2.5}
                fontSize="sm"
                fontWeight="semibold"
                shadow="sm"
                _hover={{ bg: "rose.700" }}
              >
                <CircleX size={16} />
                Reject
              </Button>
            </HStack>
          ) : null}
        </Flex>
      </Box>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
          <Box h="28" rounded="3xl" bg="slate.100" />
          <Box h="28" rounded="3xl" bg="slate.100" />
          <Box h="28" rounded="3xl" bg="slate.100" />
          <Box h="28" rounded="3xl" bg="slate.100" />
        </SimpleGrid>
      ) : error ? (
        <Box rounded="app.panel" borderWidth="1px" borderColor="rose.200" bg="rose.50" p={6} color="rose.700">
          <Flex direction={{ base: "column", sm: "row" }} gap={3} align={{ sm: "center" }} justify="space-between">
            <Box>{error}</Box>
            <Button
              type="button"
              onClick={() => void refetch()}
              rounded="full"
              bg="rose.600"
              color="white"
              px={5}
              py={2.5}
              fontSize="sm"
              fontWeight="semibold"
              _hover={{ bg: "rose.700" }}
            >
              Retry
            </Button>
          </Flex>
        </Box>
      ) : member ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
            {statCards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} tone={card.tone} />
            ))}
          </SimpleGrid>

          <Box
            role="tablist"
            aria-label="Member detail tabs"
            display="flex"
            w="full"
            alignItems="end"
            overflowX="auto"
            borderBottomWidth="1px"
            borderColor="app.border"
            style={{ scrollbarWidth: "none" }}
          >
            <Button
              type="button"
              role="tab"
              aria-selected={isMemberDetailTabActive}
              onClick={() => setActiveDetailTabId(MEMBER_DETAIL_TAB_ID)}
              flex="1"
              justifyContent="center"
              gap={2}
              roundedTop="lg"
              roundedBottom="none"
              px={4}
              py={2.5}
              fontSize="sm"
              fontWeight={isMemberDetailTabActive ? "semibold" : "medium"}
              bg={isMemberDetailTabActive ? "app.surface" : "app.surfaceAlt"}
              color={isMemberDetailTabActive ? "app.text" : "app.muted"}
              borderWidth="1px"
              borderColor="app.border"
              borderBottomColor={isMemberDetailTabActive ? "app.surface" : "app.border"}
              borderTopWidth={isMemberDetailTabActive ? "2px" : "1px"}
              borderTopColor={isMemberDetailTabActive ? "brand.600" : "app.border"}
              mt={isMemberDetailTabActive ? "-1px" : 0}
              _hover={{ bg: isMemberDetailTabActive ? "app.surface" : "app.surfaceAlt" }}
            >
              <UserRound size={14} style={{ flexShrink: 0 }} />
              <span>Member Detail</span>
            </Button>

            {customFormSections.map((section) => {
              const isActive = section.id === activeCustomFormSection?.id;

              return (
                <Button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveDetailTabId(section.id)}
                  flex="1"
                  justifyContent="center"
                  gap={2}
                  roundedTop="lg"
                  roundedBottom="none"
                  px={4}
                  py={2.5}
                  fontSize="sm"
                  fontWeight={isActive ? "semibold" : "medium"}
                  bg={isActive ? "app.surface" : "app.surfaceAlt"}
                  color={isActive ? "app.text" : "app.muted"}
                  borderWidth="1px"
                  borderColor="app.border"
                  borderBottomColor={isActive ? "app.surface" : "app.border"}
                  borderTopWidth={isActive ? "2px" : "1px"}
                  borderTopColor={isActive ? "brand.600" : "app.border"}
                  mt={isActive ? "-1px" : 0}
                  _hover={{ bg: isActive ? "app.surface" : "app.surfaceAlt" }}
                >
                  <span>{section.title}</span>
                </Button>
              );
            })}
          </Box>

          <Stack gap={6}>
            <Stack gap={6}>
              {isMemberDetailTabActive ? (
                <Stack gap={6}>
                  <Grid gap={6} alignItems="stretch" templateColumns={{ base: "1fr", xl: "repeat(2, minmax(0, 1fr))" }}>
                    <DetailPanel
                      height="full"
                      title="Profile and contact"
                    >
                      <Grid gap={4} templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }}>
                        <InfoRow icon={<UserRound size={16} />} label="Name" value={fullName} />
                        <InfoRow icon={<Mail size={16} />} label="Email" value={member.contact.email} href={`mailto:${member.contact.email}`} />
                        <InfoRow icon={<Phone size={16} />} label="Phone" value={member.contact.cellPhone || "Not provided"} href={member.contact.cellPhone ? `tel:${member.contact.cellPhone}` : undefined} />
                      </Grid>

                      {addressFields.length > 0 ? (
                        <Box mt={5} rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" p={4}>
                          <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.subtle">
                            Address
                          </Text>
                          <Grid mt={4} gap={4} templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }}>
                            {addressFields.map((field) => (
                              <InfoRow
                                key={field.label}
                                icon={getAddressFieldIcon(field.label)}
                                label={field.label}
                                value={field.value}
                              />
                            ))}
                          </Grid>
                        </Box>
                      ) : null}
                    </DetailPanel>

                    <DetailPanel
                      height="full"
                      title="Membership snapshot"
                      description="A concise view of the member's current standing and the most important lifecycle dates."
                    >
                      <Stack gap={4}>
                        <Box rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" p={4}>
                          <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.subtle">
                            Current plan
                          </Text>
                          <Text mt={2} fontSize="lg" fontWeight="semibold" color="app.text">
                            {member.membership.activeMembershipName || "Not assigned"}
                          </Text>
                        </Box>
                        <Box rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" p={4}>
                          <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.subtle">
                            Expiry
                          </Text>
                          <Text mt={2} fontSize="lg" fontWeight="semibold" color="app.text">
                            {membershipExpiryLabel}
                          </Text>
                        </Box>
                        <Box rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" p={4}>
                          <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.subtle">
                            Record notes
                          </Text>
                          <Text mt={2} fontSize="sm" lineHeight="1.7" color={member.membership.notes ? "app.text" : "app.muted"}>
                            {member.membership.notes || "No notes provided with this member record."}
                          </Text>
                        </Box>
                      </Stack>
                    </DetailPanel>
                  </Grid>

                  {customQuestionResponses.length > 0 ? (
                    <DetailPanel
                      title="Custom questions"
                      description="Individual question responses captured at registration time."
                    >
                      <Grid gap={4} templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }}>
                        {customQuestionResponses.map((item) => (
                          <Box as="article" key={item.questionUniqueId || item.questionLabel} rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" p={4}>
                            <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.subtle">
                              {item.controlType || "Question"}
                            </Text>
                            <Text as="h3" mt={2} fontSize="md" fontWeight="semibold" color="app.text">
                              {item.questionLabel || "Unnamed question"}
                            </Text>
                            <Stack mt={4} gap={2} fontSize="sm" lineHeight="1.7" color="app.muted">
                              {item.optionLabel ? <Text><Text as="span" fontWeight="medium" color="app.text">Selected:</Text> {item.optionLabel}</Text> : null}
                              {renderCustomQuestionAnswer(item)}
                            </Stack>
                          </Box>
                        ))}
                      </Grid>
                    </DetailPanel>
                  ) : null}

                </Stack>
                ) : activeCustomFormSection ? (
                  <Stack key={activeCustomFormSection.id} gap={4}>
                    <Grid gap={4} templateColumns={{ base: "1fr", md: "repeat(12, minmax(0, 1fr))" }}>
                      {activeCustomFormSection.items.map((item, index) => (
                        <Box
                          as="article"
                          key={`${item.fieldUniqueId ?? item.fieldLabel}-${item.value}`}
                          gridColumn={getCustomFormFieldGridColumn(activeCustomFormSection.layoutColumn, item.fieldLayoutColumn)}
                          position="relative"
                          rounded="app.card"
                          borderWidth="1px"
                          borderColor="app.border"
                          bg="app.surfaceAlt"
                          p={{ base: 4, sm: 5 }}
                        >
                          <Stack gap={1}>
                            <Flex align="start" gap={2}>
                              <Text fontSize="sm" fontWeight="semibold" color="app.text">
                                {item.fieldLabel || "Unnamed field"}
                              </Text>
                            </Flex>
                          </Stack>

                          <Box mt={3} rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" px={4} py={3}>
                            {renderCustomFormAnswer(item, activeCustomFormSection.items, index)}
                          </Box>
                        </Box>
                      ))}
                    </Grid>
                  </Stack>
                ) : null}
            </Stack>
          </Stack>
        </>
      ) : (
        <Box rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="app.panel">
          <EmptyStatePanel
            title="Member record unavailable"
            description="We couldn't find a member record to show. Try returning to the members list and opening another profile."
          />
        </Box>
      )}

      {moderationModalAction ? (
        <ModerationConfirmModal
          action={moderationModalAction}
          memberName={fullName}
          isSaving={isUpdatingMembershipStatus}
          onCancel={() => setPendingModerationAction(null)}
          onConfirm={() => void confirmModerationAction()}
        />
      ) : null}
    </Stack>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  const content = (
    <Box rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" p={4} shadow="sm">
      <Flex align="center" gap={2}>
        <Box as="span" display="inline-flex" h={7} w={7} alignItems="center" justifyContent="center" rounded="full" bg="app.surfaceAlt" color="app.muted">
          {icon}
        </Box>
        <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.subtle">
          {label}
        </Text>
      </Flex>
      <Text mt={3} fontSize="sm" lineHeight="1.7" color="app.text" fontFamily={mono ? "mono" : "inherit"} wordBreak={mono ? "break-all" : "normal"} fontWeight={mono ? "normal" : "medium"}>
        {value}
      </Text>
    </Box>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      style={{
        display: "block",
        transition: "all 0.2s ease",
      }}
    >
      {content}
    </a>
  );
}

function renderCustomFormAnswer(
  item: MembershipMemberCustomFormAnswer & { fieldDefinition: MembershipRegistrationCustomFormField | null },
  sectionItems: Array<MembershipMemberCustomFormAnswer & { fieldDefinition: MembershipRegistrationCustomFormField | null }>,
  index: number,
) {
  if (item.fileStorageUniqueId) {
    return (
      <AttachmentCard
        fileUniqueId={item.fileStorageUniqueId}
        fileName={item.fileOriginalFileName}
        contentType={item.fileContentType}
        fileSize={item.fileSize}
        fallbackLabel={item.value || item.fieldLabel}
      />
    );
  }

  const controlType = item.fieldDefinition
    ? getCustomFormControlType(item.fieldDefinition.formControlTypeId)
    : normalizeControlType(item.fieldType);

  switch (controlType) {
    case "checkbox":
      return <ReadOnlyCheckboxValue value={item.value} />;
    case "radio":
      return <ReadOnlyRadioValue value={item.value} options={item.fieldDefinition?.options ?? []} />;
    case "multiselect":
      return <ReadOnlyMultiSelectValue value={item.value} options={item.fieldDefinition?.options ?? []} />;
    case "country":
      return <ReadOnlyCountryValue value={item.value} />;
    case "state":
      return (
        <ReadOnlyStateValue
          countryValue={getNearestCountryValue(sectionItems, index)}
          value={item.value}
        />
      );
    case "password":
      return <ReadOnlyPasswordValue value={item.value} />;
    case "textarea":
      return <ReadOnlyTextareaValue value={item.value} />;
    default:
      return <Text fontSize="sm" lineHeight="1.7" color="app.text">{renderCustomFormValue(item.value)}</Text>;
  }
}

function renderCustomQuestionAnswer(
  item: MembershipMemberCustomQuestionAnswer & { questionDefinition: MembershipRegistrationCustomQuestion | null },
) {
  if (item.fileStorageUniqueId) {
    return (
      <AttachmentCard
        fileUniqueId={item.fileStorageUniqueId}
        fileName={item.fileOriginalFileName}
        contentType={item.fileContentType}
        fileSize={item.fileSize}
        fallbackLabel={item.value || item.questionLabel}
      />
    );
  }

  const controlType = item.questionDefinition
    ? getCustomQuestionControlType(item.questionDefinition.controlType)
    : normalizeControlType(item.controlType);

  switch (controlType) {
    case "checkbox":
      return <ReadOnlyCheckboxValue value={item.value ?? ""} />;
    case "radio":
      return <ReadOnlyRadioValue value={item.value ?? item.optionLabel ?? ""} options={item.questionDefinition?.options ?? []} />;
    case "multiselect":
      return <ReadOnlyMultiSelectValue value={item.value ?? ""} options={item.questionDefinition?.options ?? []} />;
    case "country":
      return <ReadOnlyCountryValue value={item.value ?? ""} />;
    case "state":
      return <ReadOnlyStateValue countryValue={null} value={item.value ?? ""} />;
    case "password":
      return <ReadOnlyPasswordValue value={item.value ?? ""} />;
    case "textarea":
      return <ReadOnlyTextareaValue value={item.value ?? ""} />;
    default:
      return item.value ? <p>{item.value}</p> : null;
  }
}

function ReadOnlyCheckboxValue({ value }: { value: string }) {
  const checked = value.trim().toLowerCase() === "true" || value.trim() === "1";

  return (
    <HStack gap={3} fontSize="sm" fontWeight="medium" color="app.text">
      <input
        type="checkbox"
        checked={checked}
        readOnly
        disabled
        style={{
          width: "1rem",
          height: "1rem",
          accentColor: "#06b6d4",
          flexShrink: 0,
        }}
      />
      <Text>{checked ? "Checked" : "Unchecked"}</Text>
    </HStack>
  );
}

function ReadOnlyPasswordValue({ value }: { value: string }) {
  return (
    <Input
      type="password"
      value={value}
      readOnly
      variant="subtle"
      size="md"
      bg="app.surfaceAlt"
      borderColor="app.border"
      color="app.text"
    />
  );
}

function ReadOnlyTextareaValue({ value }: { value: string }) {
  return (
    <Textarea
      value={value}
      readOnly
      rows={4}
      variant="subtle"
      bg="app.surfaceAlt"
      borderColor="app.border"
      color="app.text"
      fontSize="sm"
      lineHeight="1.7"
    />
  );
}

function ReadOnlyRadioValue({
  value,
  options,
}: {
  value: string;
  options: MembershipRegistrationCustomQuestionOption[];
}) {
  const selectedValues = parseSelectedValues(value);
  const fallbackValue = value.trim();

  if (options.length === 0) {
    return <Text fontSize="sm" lineHeight="1.7" color="app.text">{fallbackValue || "No value provided"}</Text>;
  }

  return (
    <Stack gap={2}>
      {options.map((option) => {
        const isSelected =
          selectedValues.includes(option.value) ||
          selectedValues.includes(option.uniqueId) ||
          selectedValues.includes(option.displayText) ||
          fallbackValue === option.value ||
          fallbackValue === option.uniqueId ||
          fallbackValue === option.displayText;

        return (
          <HStack key={option.uniqueId} gap={3} rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" px={3} py={2} fontSize="sm" color="app.text">
            <input
              type="checkbox"
              checked={isSelected}
              readOnly
              disabled
              style={{
                width: "1rem",
                height: "1rem",
                accentColor: "#06b6d4",
                flexShrink: 0,
              }}
            />
            <Text>{option.displayText}</Text>
          </HStack>
        );
      })}
    </Stack>
  );
}

function ReadOnlyMultiSelectValue({
  value,
  options,
}: {
  value: string;
  options: MembershipRegistrationCustomQuestionOption[];
}) {
  const selectedValues = parseSelectedValues(value);

  if (options.length === 0) {
    return selectedValues.length > 0 ? (
      <HStack flexWrap="wrap" gap={2}>
        {selectedValues.map((item) => (
          <Box key={item} rounded="app.pill" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" px={3} py={1} fontSize="xs" fontWeight="medium" color="app.text">
            {item}
          </Box>
        ))}
      </HStack>
    ) : (
      <Text fontSize="sm" lineHeight="1.7" color="app.muted">No value provided</Text>
    );
  }

  return (
    <Stack gap={2}>
      {options.map((option) => {
        const isSelected =
          selectedValues.includes(option.value) ||
          selectedValues.includes(option.uniqueId) ||
          selectedValues.includes(option.displayText);

        return (
          <HStack key={option.uniqueId} gap={3} rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" px={3} py={2} fontSize="sm" color="app.text">
            <input
              type="checkbox"
              checked={isSelected}
              readOnly
              disabled
              style={{
                width: "1rem",
                height: "1rem",
                accentColor: "#06b6d4",
                flexShrink: 0,
              }}
            />
            <Text>{option.displayText}</Text>
          </HStack>
        );
      })}
    </Stack>
  );
}

function ReadOnlyCountryValue({ value }: { value: string }) {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    void fetchCountryOptions().then((nextOptions) => {
      if (!cancelled) {
        setOptions(nextOptions);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedOptions = useMemo(() => {
    if (!value.trim()) {
      return options;
    }

    return options.some((option) => option.value === value)
      ? options
      : [{ label: value, value }, ...options];
  }, [options, value]);

  return (
    <select
      value={value}
      disabled
      style={{
        width: "100%",
        minHeight: "2.75rem",
        borderRadius: "0.75rem",
        border: "1px solid var(--chakra-colors-app-border)",
        background: "var(--chakra-colors-app-surface-alt)",
        color: "var(--chakra-colors-app-text)",
        paddingInline: "0.75rem",
        fontSize: "0.875rem",
      }}
    >
      <option value="">{resolvedOptions.length > 0 ? "Select country" : value || "No value provided"}</option>
      {resolvedOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ReadOnlyStateValue({
  countryValue,
  value,
}: {
  countryValue: string | null;
  value: string;
}) {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    if (!countryValue?.trim()) {
      setOptions([]);
      return () => {
        cancelled = true;
      };
    }

    void fetchStateOptions(countryValue).then((nextOptions) => {
      if (!cancelled) {
        setOptions(nextOptions);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [countryValue]);

  const resolvedOptions = useMemo(() => {
    if (!value.trim()) {
      return options;
    }

    return options.some((option) => option.value === value)
      ? options
      : [{ label: value, value }, ...options];
  }, [options, value]);

  return (
    <select
      value={value}
      disabled
      style={{
        width: "100%",
        minHeight: "2.75rem",
        borderRadius: "0.75rem",
        border: "1px solid var(--chakra-colors-app-border)",
        background: "var(--chakra-colors-app-surface-alt)",
        color: "var(--chakra-colors-app-text)",
        paddingInline: "0.75rem",
        fontSize: "0.875rem",
      }}
    >
      <option value="">
        {countryValue?.trim()
          ? resolvedOptions.length > 0
            ? "Select state"
            : value || "No value provided"
          : value || "Select a country first"}
      </option>
      {resolvedOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function AttachmentCard({
  fileUniqueId,
  fileName,
  contentType,
  fileSize,
  fallbackLabel,
}: {
  fileUniqueId: string;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  fallbackLabel: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = Boolean(contentType?.toLowerCase().startsWith("image/"));
  const displayName = fileName || fallbackLabel || "Attachment";
  const viewUrl = `/api/organizer/membership/type/members/files/${fileUniqueId}`;
  const downloadUrl = `/api/organizer/membership/type/members/files/${fileUniqueId}/download`;

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    if (!isImage) {
      setPreviewUrl(null);
      return () => {
        cancelled = true;
      };
    }

    void openBinaryFile(viewUrl)
      .then((url) => {
        if (cancelled) {
          window.URL.revokeObjectURL(url);
          return;
        }

        objectUrl = url;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isImage, viewUrl]);

  return (
    <Stack gap={3}>
      <Flex align="start" gap={3} rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" p={3}>
        <Flex h="2.5rem" w="2.5rem" shrink={0} align="center" justify="center" rounded="xl" bg="app.surface" color="app.muted" shadow="sm">
          {isImage ? <Image size={18} /> : <FileText size={18} />}
        </Flex>
        <Box minW={0} flex={1}>
          <Text truncate fontWeight="medium" color="app.text">{displayName}</Text>
          <Text fontSize="xs" color="app.muted">{formatAttachmentMeta(contentType, fileSize)}</Text>
        </Box>
      </Flex>

      {isImage ? (
        previewUrl ? (
          <button
            type="button"
            onClick={() => {
              window.open(previewUrl, "_blank", "noopener,noreferrer");
            }}
            style={{
              display: "block",
              width: "100%",
              overflow: "hidden",
              borderRadius: "var(--chakra-radii-app-card)",
              border: "1px solid var(--chakra-colors-app-border)",
              background: "var(--chakra-colors-app-surface)",
              padding: 0,
            }}
          >
            <img
              src={previewUrl}
              alt={displayName}
              style={{
                display: "block",
                width: "100%",
                maxHeight: "16rem",
                objectFit: "cover",
              }}
            />
          </button>
        ) : (
          <Box rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" px={4} py={6} fontSize="sm" color="app.muted">
            Loading preview...
          </Box>
        )
      ) : null}

      <HStack flexWrap="wrap" gap={2}>
        <Button
          type="button"
          onClick={() => {
            if (isImage && previewUrl) {
              window.open(previewUrl, "_blank", "noopener,noreferrer");
              return;
            }

            void openBinaryFile(viewUrl).then((url) => {
              window.open(url, "_blank", "noopener,noreferrer");
              window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
            });
          }}
          size="sm"
          variant="outline"
          colorPalette="cyan"
        >
          <ExternalLink size={14} />
          Open
        </Button>
        <Button
          type="button"
          onClick={() => {
            void downloadBinaryFile(downloadUrl, fileName || fallbackLabel || "download");
          }}
          size="sm"
          variant="outline"
          colorPalette="cyan"
        >
          <Download size={14} />
          Download
        </Button>
      </HStack>
    </Stack>
  );
}

function ModerationConfirmModal({
  action,
  memberName,
  isSaving,
  onCancel,
  onConfirm,
}: {
  action: ModerationAction;
  memberName: string;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isApprove = action === "approve";
  const title = isApprove ? "Approve member" : "Reject member";
  const description = isApprove
    ? `You are about to approve ${memberName}. This will move the member to Active status.`
    : `You are about to reject ${memberName}. This will move the member to Rejected status.`;
  const confirmLabel = isApprove ? "Confirm Approve" : "Confirm Reject";
  const icon = isApprove ? (
    <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
  ) : (
    <CircleX size={20} style={{ flexShrink: 0 }} />
  );
  return createPortal(
    <Box position="fixed" inset={0} zIndex={1200} display="flex" alignItems="center" justifyContent="center" bg="rgba(15, 23, 42, 0.5)" px={4} py={6} backdropFilter="blur(6px)">
      <Box w="full" maxW="md" rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="2xl">
        <Flex h={12} w={12} align="center" justify="center" rounded="2xl" bg={isApprove ? "emerald.50" : "rose.50"} color={isApprove ? "emerald.700" : "rose.700"}>
          {icon}
        </Flex>

        <Text mt={4} fontSize="2xl" fontWeight="semibold" letterSpacing="-0.03em" color="app.text">{title}</Text>
        <Text mt={3} fontSize="sm" lineHeight="1.7" color="app.muted">{description}</Text>
        <Text mt={3} fontSize="sm" lineHeight="1.7" color="app.muted">
          Please confirm this action before it is sent to the backend.
        </Text>

        <Flex mt={8} align="center" justify="space-between" gap={3}>
          <Button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            variant="outline"
            colorPalette="slate"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            bg={isApprove ? "emerald.600" : "rose.600"}
            color="white"
            _hover={{ bg: isApprove ? "emerald.700" : "rose.700" }}
          >
            {isSaving ? "Working..." : confirmLabel}
          </Button>
        </Flex>
      </Box>
    </Box>,
    document.body,
  );
}

function formatAttachmentMeta(contentType: string | null, fileSize: number | null) {
  const contentTypeLabel = contentType?.trim() || "Unknown type";
  const sizeLabel = fileSize !== null ? formatFileSize(fileSize) : "Unknown size";
  return `${contentTypeLabel} • ${sizeLabel}`;
}

function formatFileSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

function renderCustomFormValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return <Text color="app.muted">No value provided</Text>;
  }

  return <Text whiteSpace="pre-wrap">{trimmedValue}</Text>;
}

function getNearestCountryValue(
  items: Array<MembershipMemberCustomFormAnswer & { fieldDefinition: MembershipRegistrationCustomFormField | null }>,
  currentIndex: number,
) {
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const candidate = items[index];
    if (!candidate) {
      continue;
    }

    const candidateType = candidate.fieldDefinition
      ? getCustomFormControlType(candidate.fieldDefinition.formControlTypeId)
      : normalizeControlType(candidate.fieldType);

    if (candidateType !== "country") {
      continue;
    }

    const candidateValue = candidate.value?.trim();
    if (candidateValue) {
      return candidateValue;
    }
  }

  return null;
}
