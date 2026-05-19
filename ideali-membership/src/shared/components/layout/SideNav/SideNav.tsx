import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import { APP_ROUTES, buildMembershipMembersPath } from "../../../../routes";
import {
  MEMBERSHIP_PENDING_APPROVAL_COUNT_QUERY_KEY,
  fetchPendingApprovalCount,
} from "../../../../lib/membershipMembers";

interface SideNavProps {
  onNavigate: () => void;
}

interface MembershipNavItem {
  label: string;
  to: string;
  comingSoon?: boolean;
}

const STALE_TIME_1_MIN_MS = 60 * 1000;

function isMembershipNavItemActive(item: MembershipNavItem, locationPathname: string, locationSearch: string) {
  const itemPath = item.to.split("?")[0];

  if (item.label === "Pending Approvals") {
    if (locationPathname !== APP_ROUTES.membershipMembers) {
      return false;
    }

    const searchParams = new URLSearchParams(locationSearch);
    return searchParams.getAll("membershipStatuses").some((value) => value === "PendingApproval");
  }

  if (item.label === "Members") {
    if (locationPathname !== APP_ROUTES.membershipMembers) {
      return false;
    }

    const searchParams = new URLSearchParams(locationSearch);
    const isPendingApprovalsShortcut = searchParams
      .getAll("membershipStatuses")
      .some((value) => value === "PendingApproval");

    return !isPendingApprovalsShortcut;
  }

  if (item.label === "Invoices") {
    return locationPathname.startsWith(APP_ROUTES.membershipInvoices);
  }

  return locationPathname === itemPath;
}

const membershipItems: MembershipNavItem[] = [
  { label: "Dashboard", to: APP_ROUTES.membershipDashboard },
  { label: "Types", to: APP_ROUTES.membershipTypes },
  { label: "Members", to: APP_ROUTES.membershipMembers },
  {
    label: "Pending Approvals",
    to: buildMembershipMembersPath({ membershipStatuses: ["PendingApproval"] }),
  },
  { label: "Invoices", to: APP_ROUTES.membershipInvoices },
];

export function SideNav({ onNavigate }: SideNavProps) {
  const location = useLocation();
  const isMembershipRoute = location.pathname.startsWith(APP_ROUTES.membership);
  const [isMembershipExpanded, setIsMembershipExpanded] = useState(isMembershipRoute);
  const pendingApprovalCountQuery = useQuery({
    queryKey: MEMBERSHIP_PENDING_APPROVAL_COUNT_QUERY_KEY,
    queryFn: () => fetchPendingApprovalCount(),
    staleTime: STALE_TIME_1_MIN_MS,
  });
  const pendingApprovalCount = pendingApprovalCountQuery.data ?? 0;

  useEffect(() => {
    if (isMembershipRoute) {
      setIsMembershipExpanded(true);
    }
  }, [isMembershipRoute]);

  return (
    <Box
      as="aside"
      position={{ base: "fixed", lg: "sticky" }}
      top={{ lg: "88px" }}
      left={0}
      zIndex={40}
      w={{ base: "18rem", lg: "20rem" }}
      maxH={{ base: "100vh", lg: "calc(100vh - 88px)" }}
      overflowY="auto"
      rounded="3xl"
      borderWidth="1px"
      borderColor="slate.200"
      bg="whiteAlpha.950"
      p={6}
      shadow={{ base: "2xl", lg: "sm" }}
      backdropFilter="blur(18px)"
    >
      <HStack justify="space-between" display={{ base: "flex", lg: "none" }}>
        <Text fontSize="sm" fontWeight="semibold" letterSpacing="0.18em" color="cyan.800" textTransform="uppercase">
          Navigation
        </Text>
        <Button size="sm" variant="outline" rounded="full" borderColor="slate.200" color="slate.600" onClick={onNavigate}>
          Close
        </Button>
      </HStack>

      <Stack gap={3} mt={{ base: 6, lg: 0 }}>
        <Box rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="slate.50" p={2}>
              <Button
                type="button"
                onClick={() => setIsMembershipExpanded((current) => !current)}
                w="full"
                justifyContent="space-between"
                rounded="2xl"
            variant="ghost"
            px={3}
            py={3}
            fontSize="sm"
            fontWeight="semibold"
            color="slate.900"
            aria-expanded={isMembershipExpanded}
            aria-controls="membership-nav-group"
            _hover={{ bg: "white" }}
          >
            <span>Membership</span>
            <Text
              as="span"
              color="slate.500"
              transform={isMembershipExpanded ? "rotate(180deg)" : "rotate(0deg)"}
              transition="transform 0.2s ease"
            >
              v
            </Text>
          </Button>

          {isMembershipExpanded ? (
            <Stack id="membership-nav-group" gap={2} mt={2}>
              {membershipItems.map((item) => (
                <NavLink key={item.label} to={item.to} onClick={onNavigate}>
                  {() => {
                    const isActive = isMembershipNavItemActive(item, location.pathname, location.search);
                    const isPendingApprovalsItem = item.label === "Pending Approvals";

                    return (
                      <HStack
                        justify="space-between"
                        rounded="2xl"
                        px={4}
                        py={3}
                        fontSize="sm"
                        fontWeight="medium"
                        transition="all 0.2s ease"
                        bg={isActive ? "cyan.50" : "transparent"}
                        color={isActive ? "cyan.800" : "slate.700"}
                        _hover={{ bg: isActive ? "cyan.50" : "slate.100" }}
                      >
                        <Text>{item.label}</Text>
                        <HStack gap={2}>
                          {isPendingApprovalsItem && pendingApprovalCount > 0 ? (
                            <Badge rounded="full" px={2} py={0.5} bg="amber.100" color="amber.700" fontSize="10px">
                              {pendingApprovalCount}
                            </Badge>
                          ) : null}
                          {item.comingSoon ? (
                            <Badge rounded="full" px={2} py={0.5} bg="amber.100" color="amber.700" fontSize="10px">
                              Soon
                            </Badge>
                          ) : null}
                          {isActive ? (
                            <Badge rounded="full" px={2} py={0.5} bg="cyan.500" color="white" fontSize="10px">
                              Active
                            </Badge>
                          ) : null}
                        </HStack>
                      </HStack>
                    );
                  }}
                </NavLink>
              ))}
            </Stack>
          ) : null}
        </Box>

        <Box rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="white" p={2} shadow="sm">
          <NavLink to={APP_ROUTES.customForms} onClick={onNavigate}>
            {({ isActive }) => (
              <HStack
                justify="space-between"
                rounded="2xl"
                px={4}
                py={3}
                fontSize="sm"
                fontWeight="medium"
                transition="all 0.2s ease"
                bg={isActive ? "cyan.50" : "transparent"}
                color={isActive ? "cyan.800" : "slate.700"}
                _hover={{ bg: isActive ? "cyan.50" : "slate.100" }}
              >
                <Text>Custom Forms</Text>
                {isActive ? (
                  <Badge rounded="full" px={2} py={0.5} bg="cyan.500" color="white" fontSize="10px">
                    Active
                  </Badge>
                ) : null}
              </HStack>
            )}
          </NavLink>
        </Box>

        <Box rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="white" p={2} shadow="sm">
          <NavLink to={APP_ROUTES.dndPlayground} onClick={onNavigate}>
            {({ isActive }) => (
              <HStack
                justify="space-between"
                rounded="2xl"
                px={4}
                py={3}
                fontSize="sm"
                fontWeight="medium"
                transition="all 0.2s ease"
                bg={isActive ? "cyan.50" : "transparent"}
                color={isActive ? "cyan.800" : "slate.700"}
                _hover={{ bg: isActive ? "cyan.50" : "slate.100" }}
              >
                <Text>Dnd Playground</Text>
                {isActive ? (
                  <Badge rounded="full" px={2} py={0.5} bg="cyan.500" color="white" fontSize="10px">
                    Active
                  </Badge>
                ) : null}
              </HStack>
            )}
          </NavLink>
        </Box>
      </Stack>

      <Box mt={8} rounded="3xl" borderWidth="1px" borderColor="cyan.100" bg="cyan.50" p={5}>
        <Text fontSize="sm" fontWeight="semibold" color="slate.900">
          Quick note
        </Text>
        <Box my={3} h="1px" bg="cyan.100" />
        <Text fontSize="sm" lineHeight="1.7" color="slate.600">
          Keep membership actions grouped together so the structure stays easy to scan.
        </Text>
      </Box>
    </Box>
  );
}
