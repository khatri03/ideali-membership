import { useNavigate } from "react-router-dom";
import { Badge, Box, Button, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { APP_ROUTES } from "../routes";

const metrics = [
  { label: "Active members", value: "4,218", delta: "+12.4%" },
  { label: "Renewal rate", value: "96.2%", delta: "+3.1%" },
  { label: "Monthly revenue", value: "$84.9k", delta: "+9.8%" },
];

const activity = [
  { title: "12 renewals completed", detail: "Today at 09:42" },
  { title: "New enterprise plan purchased", detail: "Today at 11:15" },
  { title: "7 members updated profiles", detail: "Today at 12:08" },
];

const quickActions = [
  "Review pending applications",
  "Adjust membership plans",
  "Export today's activity",
];

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <Box display="grid" gap={{ base: 6, xl: 8 }} xl={{ gridTemplateColumns: "minmax(0, 1.35fr) minmax(360px, 0.85fr)" }}>
      <Stack gap={6}>
        <Box rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="whiteAlpha.900" p={{ base: 7, lg: 10 }} shadow="sm">
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
            Protected dashboard
          </Badge>

          <Stack gap={5} mt={6}>
            <Heading as="h1" size={{ base: "3xl", lg: "4xl" }} letterSpacing="-0.04em" lineHeight="0.95">
              Welcome to the dashboard.
            </Heading>
            <Text maxW="3xl" fontSize={{ base: "md", lg: "lg" }} lineHeight="1.85" color="slate.600">
              This area is only available after authentication. The route stays visible in the URL so navigation works like a real app.
            </Text>
            <Button
              type="button"
              alignSelf="flex-start"
              rounded="full"
              bg="slate.900"
              px={5}
              py={3}
              fontSize="sm"
              fontWeight="semibold"
              color="white"
              _hover={{ bg: "slate.800" }}
              onClick={() => navigate(APP_ROUTES.membershipWizardTitle)}
            >
              Open membership wizard
            </Button>
          </Stack>
        </Box>

        <SimpleGrid columns={{ base: 1, sm: 3 }} gap={5}>
          {metrics.map((metric) => (
            <Box key={metric.label} rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="whiteAlpha.900" p={6} shadow="sm">
              <Text fontSize="sm" color="slate.500">
                {metric.label}
              </Text>
              <HStack mt={3} align="end" justify="space-between">
                <Text fontSize="3xl" fontWeight="semibold" color="slate.900">
                  {metric.value}
                </Text>
                <Badge rounded="full" px={2.5} py={1} bg="emerald.50" color="emerald.700" fontSize="xs" fontWeight="medium">
                  {metric.delta}
                </Badge>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
          {quickActions.map((item) => (
            <Button
              key={item}
              type="button"
              rounded="3xl"
              borderWidth="1px"
              borderColor="slate.200"
              bg="whiteAlpha.900"
              px={5}
              py={8}
              h="auto"
              justifyContent="flex-start"
              textAlign="left"
              color="slate.700"
              fontWeight="medium"
              _hover={{ borderColor: "cyan.300", bg: "cyan.50" }}
            >
              {item}
            </Button>
          ))}
        </SimpleGrid>
      </Stack>

      <Box rounded="3xl" borderWidth="1px" borderColor="slate.200" bg="whiteAlpha.900" p={{ base: 7, lg: 10 }} shadow="sm">
        <HStack justify="space-between" align="start">
          <Box>
            <Text fontSize="sm" color="slate.500">
              Overview
            </Text>
            <Heading as="h2" mt={1} size="xl" letterSpacing="-0.03em">
              Today&apos;s summary
            </Heading>
          </Box>
          <Badge rounded="full" px={3} py={1} bg="cyan.50" color="cyan.800" fontSize="xs" fontWeight="semibold">
            Live
          </Badge>
        </HStack>

        <Stack gap={4} mt={7}>
          {activity.map((item) => (
            <HStack key={item.title} align="start" gap={4} rounded="2xl" borderWidth="1px" borderColor="slate.200" bg="slate.50" p={4}>
              <Box mt={1} h="2.5" w="2.5" rounded="full" bg="cyan.500" flexShrink={0} />
              <Stack gap={1}>
                <Text fontWeight="medium" color="slate.900">
                  {item.title}
                </Text>
                <Text fontSize="sm" color="slate.500">
                  {item.detail}
                </Text>
              </Stack>
            </HStack>
          ))}
        </Stack>

        <Box mt={7} rounded="3xl" borderWidth="1px" borderColor="cyan.100" bg="cyan.50" p={6}>
          <Text fontSize="sm" color="cyan.700">
            Session status
          </Text>
          <Text mt={2} fontSize="lg" fontWeight="semibold" color="slate.900">
            Authenticated and ready.
          </Text>
          <Text mt={2} fontSize="sm" lineHeight="1.7" color="slate.600">
            Your access token and refresh token are stored locally for the current session.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
