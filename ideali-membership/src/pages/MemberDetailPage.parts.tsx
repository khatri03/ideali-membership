import type { ReactNode } from "react";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";

type DetailPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  height?: string;
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "slate" | "cyan" | "emerald" | "amber" | "rose";
};

type EmptyStatePanelProps = {
  title: string;
  description: string;
};

export function DetailPanel({ title, description, children, action, height }: DetailPanelProps) {
  return (
    <Box
      as="section"
      rounded="app.panel"
      borderWidth="1px"
      borderColor="app.border"
      bg="app.surface"
      p={{ base: 5, md: 6 }}
      shadow="app.panel"
      height={height}
    >
      <Flex direction={{ base: "column", sm: "row" }} gap={4} align={{ sm: "flex-start" }} justify="space-between">
        <Stack gap={2}>
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="semibold" letterSpacing="-0.02em" color="app.text">
            {title}
          </Text>
          {description ? (
            <Text maxW="2xl" fontSize="sm" lineHeight="1.7" color="app.muted">
              {description}
            </Text>
          ) : null}
        </Stack>
        {action ? <Flex shrink={0} align="center" gap={2}>{action}</Flex> : null}
      </Flex>

      <Box mt={6}>{children}</Box>
    </Box>
  );
}

export function StatCard({ label, value, detail, tone = "slate" }: StatCardProps) {
  return (
    <Box
      as="article"
      rounded="app.card"
      borderWidth="1px"
      borderColor="app.border"
      bg={tone === "slate" ? "app.surface" : `${tone}.50`}
      p={5}
      shadow="sm"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        insetInlineStart: 0,
        top: 0,
        bottom: 0,
        w: "4px",
        bg: tone === "slate" ? "app.borderStrong" : `${tone}.400`,
      }}
    >
      <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.subtle">
        {label}
      </Text>
      <Text mt={3} fontSize="2xl" fontWeight="semibold" letterSpacing="-0.03em" color="app.text">
        {value}
      </Text>
      {detail ? (
        <Text mt={2} fontSize="sm" lineHeight="1.7" color="app.muted">
          {detail}
        </Text>
      ) : null}
    </Box>
  );
}

export function EmptyStatePanel({ title, description }: EmptyStatePanelProps) {
  return (
    <Box rounded="app.card" borderWidth="1px" borderStyle="dashed" borderColor="app.border" bg="app.surfaceAlt" px={5} py={10} textAlign="center">
      <Text fontSize="md" fontWeight="semibold" color="app.text">
        {title}
      </Text>
      <Text mt={2} fontSize="sm" lineHeight="1.7" color="app.muted">
        {description}
      </Text>
    </Box>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: "slate" | "cyan" | "emerald" | "amber" | "rose" }) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      rounded="app.pill"
      borderWidth="1px"
      px={3}
      py={1}
      fontSize="xs"
      fontWeight="semibold"
      color={`${tone}.700`}
      borderColor={`${tone}.100`}
      bg={`${tone}.50`}
    >
      {label}
    </Box>
  );
}
