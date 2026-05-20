import { Box, Button, Input, Stack, Text } from "@chakra-ui/react";
import { MultiSelectInput } from "../../../components/inputs/MultiSelectInput/MultiSelectInput";

export type MembersFilterOption = {
  label: string;
  value: string;
};

type MembersFiltersProps = {
  draftMembershipStatuses: string[];
  draftMembershipTypeUniqueIds: string[];
  draftSearchTerm: string;
  hasPendingFilterChanges: boolean;
  isMembersFetching: boolean;
  isMembershipTypesLoading: boolean;
  isMembershipStatusesLoading: boolean;
  membershipStatusOptions: MembersFilterOption[];
  selectedMembershipStatuses: string[];
  membershipTypeOptions: MembersFilterOption[];
  selectedMembershipTypeUniqueIds: string[];
  selectedSearchTerm: string;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDraftMembershipStatusesChange: (value: string[]) => void;
  onDraftMembershipTypeUniqueIdsChange: (value: string[]) => void;
  onDraftSearchTermChange: (value: string) => void;
};

function normalizeUniqueIds(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort();
}

export function MembersFilters({
  membershipStatusOptions,
  draftMembershipStatuses,
  draftMembershipTypeUniqueIds,
  draftSearchTerm,
  hasPendingFilterChanges,
  isMembersFetching,
  isMembershipTypesLoading,
  isMembershipStatusesLoading,
  selectedMembershipStatuses,
  membershipTypeOptions,
  selectedMembershipTypeUniqueIds,
  selectedSearchTerm,
  onApplyFilters,
  onClearFilters,
  onDraftMembershipStatusesChange,
  onDraftMembershipTypeUniqueIdsChange,
  onDraftSearchTermChange,
}: MembersFiltersProps) {
  return (
    <Box mb={6} rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="slate.50" p={5} shadow="sm">
      <Stack
        as="form"
        aria-label="Filters"
        gap={4}
        onSubmit={(event) => {
          event.preventDefault();
          if (isMembersFetching || !hasPendingFilterChanges) {
            return;
          }
          onApplyFilters();
        }}
      >
        <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="slate.500">
          Filters
        </Text>

        <Box display="grid" gap={4} gridTemplateColumns={{ base: "1fr", lg: "repeat(3, minmax(0, 1fr))" }} alignItems={{ lg: "end" }}>
          <Stack gap={2}>
            <label htmlFor="member-search" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--chakra-colors-slate-500)" }}>
              Search
            </label>
            <Input
              id="member-search"
              value={draftSearchTerm}
              onChange={(event) => onDraftSearchTermChange(event.target.value)}
              placeholder="Name, email, or phone"
              type="search"
              disabled={isMembersFetching}
              h="13"
              rounded="xl"
              borderColor="slate.200"
              bg="white"
              px={4}
              py={3}
              fontSize="sm"
              color="slate.900"
              _placeholder={{ color: "slate.400" }}
              _focusVisible={{ borderColor: "cyan.400", boxShadow: "0 0 0 4px rgba(34, 211, 238, 0.12)" }}
              _disabled={{ cursor: "not-allowed", bg: "slate.100", color: "slate.500" }}
            />
          </Stack>

          <Stack gap={2}>
            <label htmlFor="membership-type-filter" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--chakra-colors-slate-500)" }}>
              Membership Types
            </label>
            <Box w="full">
              <MultiSelectInput
                value={
                  hasPendingFilterChanges
                    ? normalizeUniqueIds(draftMembershipTypeUniqueIds)
                    : normalizeUniqueIds(selectedMembershipTypeUniqueIds)
                }
                onChange={onDraftMembershipTypeUniqueIdsChange}
                options={membershipTypeOptions}
                placeholder="All membership types"
                isDisabled={isMembershipTypesLoading || isMembersFetching}
                inputId="membership-type-filter"
              />
            </Box>
          </Stack>

          <Stack gap={2}>
            <label htmlFor="membership-status-filter" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--chakra-colors-slate-500)" }}>
              Membership Status
            </label>
            <Box w="full">
              <MultiSelectInput
                value={draftMembershipStatuses}
                onChange={onDraftMembershipStatusesChange}
                options={membershipStatusOptions}
                placeholder="All membership statuses"
                isDisabled={isMembershipStatusesLoading || isMembersFetching}
                inputId="membership-status-filter"
              />
            </Box>
          </Stack>
        </Box>

        <Box display="flex" flexWrap="wrap" justifyContent="end" gap={3}>
          <Button
            type="submit"
            rounded="full"
            bg="slate.950"
            px={4}
            py={2}
            fontSize="sm"
            fontWeight="semibold"
            color="white"
            shadow="sm"
            _hover={{ bg: "slate.800" }}
            _disabled={{ cursor: "not-allowed", bg: "slate.200", color: "slate.500" }}
            disabled={!hasPendingFilterChanges || isMembersFetching}
          >
            {isMembersFetching ? "Applying..." : "Apply filter"}
          </Button>

          {selectedMembershipStatuses.length > 0 ||
          selectedMembershipTypeUniqueIds.length > 0 ||
          selectedSearchTerm.length > 0 ? (
            <Button
              type="button"
              onClick={onClearFilters}
              rounded="full"
              borderWidth="1px"
              borderColor="cyan.200"
              bg="cyan.50"
              px={4}
              py={2}
              fontSize="sm"
              fontWeight="semibold"
              color="cyan.800"
              _hover={{ borderColor: "cyan.300", bg: "cyan.100" }}
              _disabled={{ cursor: "not-allowed", opacity: 0.5 }}
              disabled={isMembersFetching}
            >
              Clear filters
            </Button>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
