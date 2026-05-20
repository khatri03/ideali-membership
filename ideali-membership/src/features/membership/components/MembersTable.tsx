import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatUtcToLocalDateTime } from "../../../lib/dateTime";
import { buildMembershipMemberDetailPath } from "../../../routes";
import { Badge, Box, Button, HStack, Menu, Portal, Stack, Table, Text } from "@chakra-ui/react";
import type { MembershipMemberListItem, MembershipMemberSortBy } from "../../../types/membership";
import type { MembersFilterOption } from "./MembersFilters";

function formatExpiry(value: string | null) {
  return formatUtcToLocalDateTime(value);
}

function getMembershipStatusStyles(value: string) {
  switch (value) {
    case "PendingApproval":
    case "Pending":
      return { borderColor: "amber.200", bg: "amber.50", color: "amber.700" };
    case "Active":
      return { borderColor: "emerald.200", bg: "emerald.50", color: "emerald.700" };
    case "Expired":
      return { borderColor: "rose.200", bg: "rose.50", color: "rose.700" };
    case "InActive":
    case "NearExpiry":
      return { borderColor: "slate.200", bg: "slate.50", color: "slate.700" };
    default:
      return { borderColor: "slate.200", bg: "slate.50", color: "slate.700" };
  }
}

type MembersTableProps = {
  members: MembershipMemberListItem[];
  membershipStatusOptions: MembersFilterOption[];
  sortBy?: MembershipMemberSortBy;
  sortOrder?: "asc" | "desc";
  onSort: (sortBy: MembershipMemberSortBy) => void;
  onClearSort: () => void;
};

function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" style={{ height: "1.25rem", width: "1.25rem", fill: "currentColor" }}>
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

function MemberDetailMenu({ member }: { member: MembershipMemberListItem }) {
  return (
    <Menu.Root positioning={{ placement: "bottom-start", gutter: 8 }}>
      <Menu.Trigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          rounded="full"
          h="10"
          w="10"
          minW="10"
          p="0"
          color="slate.500"
          borderWidth="1px"
          borderColor="slate.200"
          bg="white"
          shadow="sm"
          _hover={{ borderColor: "cyan.200", bg: "cyan.50", color: "cyan.700" }}
          aria-label={`Open detail actions for ${member.memberFullName}`}
          title="Detail"
        >
          <DotsIcon />
        </Button>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="12rem" rounded="xl" borderWidth="1px" borderColor="slate.200" bg="white" p="1.5" shadow="xl">
            {member.uniqueId ? (
              <Menu.Item
                value={`member-detail-${member.uniqueId}`}
                rounded="lg"
                px="3"
                py="2.5"
                color="slate.700"
                _highlighted={{ bg: "slate.50", color: "slate.950" }}
                asChild
              >
                <Link to={buildMembershipMemberDetailPath(member.uniqueId)}>
                  <Text fontSize="sm" fontWeight="medium">
                    Detail
                  </Text>
                </Link>
              </Menu.Item>
            ) : (
              <Box px="3" py="2.5" fontSize="sm" color="slate.300">
                Detail unavailable
              </Box>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

export function MembersTable({
  members,
  membershipStatusOptions,
  sortBy,
  sortOrder,
  onSort,
  onClearSort,
}: MembersTableProps) {
  const membershipStatusLabelMap = new Map(
    membershipStatusOptions.map((item) => [item.value, item.label] as const),
  );

  function renderSortIcon(columnSortBy: MembershipMemberSortBy) {
    if (sortBy !== columnSortBy) {
      return <ArrowUpDown size={14} style={{ color: "#94a3b8" }} />;
    }

    return sortOrder === "desc" ? (
      <ArrowDown size={14} style={{ color: "#0e7490" }} />
    ) : (
      <ArrowUp size={14} style={{ color: "#0e7490" }} />
    );
  }

  function getSortTooltip(columnSortBy: MembershipMemberSortBy, label: string) {
    if (sortBy !== columnSortBy) {
      return `Sort by ${label}`;
    }

    if (sortOrder === "asc") {
      return `Sort by ${label} descending`;
    }

    return `Clear sort by ${label}`;
  }

  return (
    <Stack gap={3}>
      {sortBy ? (
        <Box display="flex" justifyContent="end">
          <Button
            type="button"
            onClick={onClearSort}
            title="Clear current sort"
            rounded="full"
            borderWidth="1px"
            borderColor="cyan.100"
            bg="cyan.50"
            color="slate.700"
            shadow="sm"
            _hover={{ bg: "cyan.100" }}
          >
            <HStack gap="2">
              <X size={14} />
              <Text fontSize="sm" fontWeight="medium">
                Clear Sort
              </Text>
            </HStack>
          </Button>
        </Box>
      ) : null}

      <Box maxH="38rem" overflow="auto" rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="white" shadow="lg">
        <Table.Root aria-label="Registered members" minW="980px" tableLayout="fixed">
          <Table.Header position="sticky" top="0" zIndex="1" bg="cyan.50" backdropFilter="blur(8px)">
            <Table.Row borderBottomWidth="1px" borderColor="cyan.100">
              <Table.ColumnHeader h="12" borderRightWidth="1px" borderColor="cyan.200" px={4} textAlign="left">
                <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.12em" textTransform="uppercase" color="slate.700">
                  Actions
                </Text>
              </Table.ColumnHeader>
              <Table.ColumnHeader
                h="12"
                borderRightWidth="1px"
                borderColor="cyan.200"
                px={4}
                aria-sort={sortBy === "memberFullName" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
              >
                <Button
                  type="button"
                  variant="ghost"
                  p="0"
                  w="full"
                  justifyContent="flex-start"
                  gap="1.5"
                  color="slate.700"
                  fontSize="xs"
                  fontWeight="semibold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  onClick={() => onSort("memberFullName")}
                  title={getSortTooltip("memberFullName", "Member")}
                >
                  Member
                  {renderSortIcon("memberFullName")}
                </Button>
              </Table.ColumnHeader>
              <Table.ColumnHeader
                h="12"
                borderRightWidth="1px"
                borderColor="cyan.200"
                px={4}
                aria-sort={sortBy === "activeMembershipName" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
              >
                <Button
                  type="button"
                  variant="ghost"
                  p="0"
                  w="full"
                  justifyContent="flex-start"
                  gap="1.5"
                  color="slate.700"
                  fontSize="xs"
                  fontWeight="semibold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  onClick={() => onSort("activeMembershipName")}
                  title={getSortTooltip("activeMembershipName", "Active Membership")}
                >
                  Active Membership
                  {renderSortIcon("activeMembershipName")}
                </Button>
              </Table.ColumnHeader>
              <Table.ColumnHeader
                h="12"
                borderRightWidth="1px"
                borderColor="cyan.200"
                px={4}
                aria-sort={sortBy === "membershipStatus" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
              >
                <Button
                  type="button"
                  variant="ghost"
                  p="0"
                  w="full"
                  justifyContent="flex-start"
                  gap="1.5"
                  color="slate.700"
                  fontSize="xs"
                  fontWeight="semibold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  onClick={() => onSort("membershipStatus")}
                  title={getSortTooltip("membershipStatus", "Membership Status")}
                >
                  Membership Status
                  {renderSortIcon("membershipStatus")}
                </Button>
              </Table.ColumnHeader>
              <Table.ColumnHeader
                h="12"
                borderRightWidth="1px"
                borderColor="cyan.200"
                px={4}
                textAlign="center"
                aria-sort={sortBy === "email" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
              >
                <Button
                  type="button"
                  variant="ghost"
                  p="0"
                  w="full"
                  justifyContent="center"
                  gap="1.5"
                  color="slate.700"
                  fontSize="xs"
                  fontWeight="semibold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  onClick={() => onSort("email")}
                  title={getSortTooltip("email", "Email")}
                >
                  Email
                  {renderSortIcon("email")}
                </Button>
              </Table.ColumnHeader>
              <Table.ColumnHeader
                h="12"
                px={4}
                textAlign="center"
                aria-sort={sortBy === "membershipExpiryUtc" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
              >
                <Button
                  type="button"
                  variant="ghost"
                  p="0"
                  w="full"
                  justifyContent="center"
                  gap="1.5"
                  color="slate.700"
                  fontSize="xs"
                  fontWeight="semibold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  onClick={() => onSort("membershipExpiryUtc")}
                  title={getSortTooltip("membershipExpiryUtc", "Membership Expiry")}
                >
                  Membership Expiry
                  {renderSortIcon("membershipExpiryUtc")}
                </Button>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {members.map((member, index) => (
              <Table.Row
                key={member.uniqueId || `${member.memberFullName}-${member.email}-${index}`}
                bg={index % 2 === 0 ? "white" : "slate.50"}
                _hover={{ bg: "cyan.50/40" }}
              >
                <Table.Cell borderRightWidth="1px" borderColor="slate.200" px={4} py={3}>
                  <MemberDetailMenu member={member} />
                </Table.Cell>
                <Table.Cell borderRightWidth="1px" borderColor="slate.200" px={4} py={3}>
                  {member.uniqueId ? (
                    <Link
                      to={buildMembershipMemberDetailPath(member.uniqueId)}
                      style={{
                        color: "#0e7490",
                        fontWeight: 600,
                        textDecorationLine: "underline",
                        textDecorationColor: "#a5f3fc",
                        textUnderlineOffset: "4px",
                        transition: "color 150ms ease, text-decoration-color 150ms ease",
                      }}
                    >
                      {member.memberFullName}
                    </Link>
                  ) : (
                    <Text fontWeight="semibold" color="slate.900">
                      {member.memberFullName}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell borderRightWidth="1px" borderColor="slate.200" px={4} py={3}>
                  {member.activeMembershipName}
                </Table.Cell>
                <Table.Cell borderRightWidth="1px" borderColor="slate.200" px={4} py={3}>
                  <Badge
                    rounded="full"
                    borderWidth="1px"
                    px="3"
                    py="1"
                    fontSize="xs"
                    fontWeight="semibold"
                    {...getMembershipStatusStyles(member.membershipStatus)}
                  >
                    {membershipStatusLabelMap.get(member.membershipStatus) ?? member.membershipStatus}
                  </Badge>
                </Table.Cell>
                <Table.Cell borderRightWidth="1px" borderColor="slate.200" px={4} py={3}>
                  {member.email}
                </Table.Cell>
                <Table.Cell px={4} py={3} textAlign="center">
                  {formatExpiry(member.membershipExpiryUtc)}
                </Table.Cell>
              </Table.Row>
            ))}

            {members.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} py={12} textAlign="center" color="slate.500">
                  No registered members found.
                </Table.Cell>
              </Table.Row>
            ) : null}
          </Table.Body>
        </Table.Root>
      </Box>
    </Stack>
  );
}
