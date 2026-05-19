import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { Badge, Box, Button, Heading, HStack, Stack, Table, Text } from "@chakra-ui/react";
import { APP_ROUTES } from "../routes";
import { getMembershipTypeOrderList, getMembershipTypes, saveMembershipTypeOrderList } from "../lib/membershipWizard";
import type { MembershipTypeOrderListItem } from "../types/membership";
import { showToast } from "./MembershipTypesPage.helpers";
import { MembershipTypeRow, OrderConfirmModal } from "./MembershipTypesPage.parts";

export function MembershipTypesPage() {
  const navigate = useNavigate();
  const { data: types = [], isLoading, error, refetch: refetchTypes } = useQuery({
    queryKey: ["membership-types"],
    queryFn: getMembershipTypes,
  });
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrderModalLoading, setIsOrderModalLoading] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderItems, setOrderItems] = useState<MembershipTypeOrderListItem[]>([]);
  const [orderError, setOrderError] = useState("");
  const orderModalRef = useRef<HTMLDivElement>(null);

  async function refreshTypes(): Promise<void> {
    await refetchTypes();
  }

  function openOrderModal() {
    setIsOrderModalOpen(true);
  }

  function moveOrderItem(sourceUniqueId: string, targetUniqueId: string) {
    setOrderItems((currentItems) => {
      const sourceIndex = currentItems.findIndex((item) => item.uniqueId === sourceUniqueId);
      const targetIndex = currentItems.findIndex((item) => item.uniqueId === targetUniqueId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return currentItems;
      }

      return arrayMove(currentItems, sourceIndex, targetIndex);
    });
  }

  async function saveOrder() {
    if (orderItems.length === 0) {
      return;
    }

    setIsSavingOrder(true);

    try {
      await saveMembershipTypeOrderList(orderItems.map((item) => item.uniqueId));
      await refreshTypes();
      showToast("Membership order saved successfully.");
      setIsOrderModalOpen(false);
    } finally {
      setIsSavingOrder(false);
    }
  }

  useEffect(() => {
    if (!isOrderModalOpen) {
      return;
    }

    let isMounted = true;

    async function loadOrderItems() {
      setIsOrderModalLoading(true);
      setOrderError("");

      try {
        const items = await getMembershipTypeOrderList();
        if (isMounted) {
          setOrderItems(items);
        }
      } catch (loadOrderError) {
        if (isMounted) {
          setOrderError(loadOrderError instanceof Error ? loadOrderError.message : "Unable to load membership order.");
        }
      } finally {
        if (isMounted) {
          setIsOrderModalLoading(false);
        }
      }
    }

    void loadOrderItems();

    return () => {
      isMounted = false;
    };
  }, [isOrderModalOpen]);

  return (
    <Box rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="whiteAlpha.900" p={{ base: 6, lg: 8 }} shadow="sm">
      <Stack gap={4} direction={{ base: "column", sm: "row" }} align={{ base: "stretch", sm: "start" }} justify="space-between">
        <Box maxW="3xl">
          <Badge
            rounded="full"
            px={4}
            py={2}
            bg="cyan.50"
            color="cyan.800"
            borderWidth="1px"
            borderColor="cyan.100"
            fontSize="sm"
            fontWeight="semibold"
          >
            Membership types
          </Badge>
          <Heading as="h1" mt={4} size={{ base: "3xl", lg: "4xl" }} letterSpacing="-0.04em" lineHeight="0.95">
            Types
          </Heading>
          <Text mt={4} maxW="2xl" fontSize={{ base: "md", lg: "lg" }} lineHeight="1.8" color="slate.600">
            Membership types will be managed here.
          </Text>
        </Box>

        <Button
          type="button"
          onClick={() => navigate(APP_ROUTES.membershipWizardTitle)}
          rounded="full"
          bg="slate.900"
          color="white"
          px={5}
          py={3}
          fontSize="sm"
          fontWeight="semibold"
          _hover={{ bg: "slate.800" }}
        >
          Create
        </Button>
      </Stack>

      <HStack justify="end" mt={8}>
        <Button
          type="button"
          onClick={openOrderModal}
          rounded="full"
          borderWidth="1px"
          borderColor="slate.200"
          bg="white"
          color="slate.500"
          h="11"
          w="11"
          minW="11"
          px={0}
          _hover={{ bg: "slate.100", color: "slate.900" }}
          aria-label="Change order"
          title="Change order"
        >
          <ArrowUpDown size={20} />
        </Button>
      </HStack>

      <Box mt={8}>
        {isLoading ? (
          <Box rounded="3xl" borderWidth="1px" borderStyle="dashed" borderColor="slate.200" bg="slate.50" px={5} py={10} textAlign="center">
            <Text fontSize="sm" color="slate.500">
              Loading membership types...
            </Text>
          </Box>
        ) : error ? (
          <Box rounded="3xl" borderWidth="1px" borderColor="red.200" bg="red.50" px={5} py={4} color="red.700">
            <Text fontSize="sm" fontWeight="medium">
              {error.message || "Unable to load membership types."}
            </Text>
          </Box>
        ) : types.length > 0 ? (
          <Box rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="white" shadow="lg" overflowX="auto">
            <Table.Root minW="1120px" tableLayout="auto">
              <Table.Header bg="slate.50">
                <Table.Row>
                  <Table.ColumnHeader w="18" px={5} py={4} textAlign="left">
                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="slate.500">
                      Actions
                    </Text>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={5} py={4} textAlign="left">
                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="slate.500">
                      Membership Type
                    </Text>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={5} py={4} textAlign="right">
                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="slate.500">
                      Pricing
                    </Text>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={5} py={4} textAlign="center">
                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="slate.500">
                      Active Members
                    </Text>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={5} py={4} textAlign="center">
                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="slate.500">
                      Pending Approvals
                    </Text>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={5} py={4} textAlign="left">
                    <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="slate.500">
                      Tenure
                    </Text>
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body bg="white">
                {types.map((item) => (
                  <MembershipTypeRow key={item.value} item={item} onRefresh={refreshTypes} />
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        ) : (
          <Box rounded="3xl" borderWidth="1px" borderStyle="dashed" borderColor="slate.200" bg="slate.50" px={5} py={10} textAlign="center">
            <Text fontSize="sm" color="slate.500">
              No membership types found.
            </Text>
          </Box>
        )}
      </Box>

      {isOrderModalOpen ? (
        <OrderConfirmModal
          onCancel={() => setIsOrderModalOpen(false)}
          modalRef={orderModalRef}
          isLoading={isOrderModalLoading}
          items={orderItems}
          error={orderError}
          isSaving={isSavingOrder}
          onMoveItem={moveOrderItem}
          onSave={saveOrder}
        />
      ) : null}
    </Box>
  );
}
