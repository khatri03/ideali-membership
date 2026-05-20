import { Badge, Box, Button, Container, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { useAuth } from "../../../../features/auth/AuthContext";

interface TopBarProps {
  isNavVisible: boolean;
  onNavToggle: () => void;
}

export function TopBar({ isNavVisible, onNavToggle }: TopBarProps) {
  const { session, signOut } = useAuth();

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={30}
      borderBottomWidth="1px"
      borderColor="app.border"
      bg="app.surface"
      backdropFilter="blur(18px)"
    >
      <Container maxW="8xl" px={{ base: 4, sm: 6, xl: 10 }} py={4}>
        <Flex align="center" gap={4}>
          <Button
            type="button"
            onClick={onNavToggle}
            variant="outline"
            rounded="xl"
            borderColor="app.border"
            color="app.text"
            px={3}
            py={2}
            aria-label={isNavVisible ? "Hide navigation sidebar" : "Show navigation sidebar"}
            aria-pressed={isNavVisible}
            _hover={{ bg: "app.surfaceAlt" }}
          >
            <Stack gap={1} mr={2}>
              <Box h="0.5" w="4" rounded="full" bg="currentColor" />
              <Box h="0.5" w="4" rounded="full" bg="currentColor" />
              <Box h="0.5" w="4" rounded="full" bg="currentColor" />
            </Stack>
            <Text display={{ base: "none", sm: "inline" }} fontSize="sm" fontWeight="medium">
              {isNavVisible ? "Hide sidebar" : "Show sidebar"}
            </Text>
          </Button>

          <HStack minW={0} flex="1" gap={3}>
            <Box
              display="grid"
              placeItems="center"
              h="11"
              w="11"
              rounded="2xl"
              bg="brand.50"
              color="brand.800"
              borderWidth="1px"
              borderColor="brand.100"
              fontWeight="bold"
            >
              I
            </Box>
            <Box minW={0}>
              <Text truncate fontSize="sm" fontWeight="semibold" letterSpacing="0.18em" color="brand.800" textTransform="uppercase">
                Ideali Membership
              </Text>
              <Text truncate fontSize="sm" color="app.muted">
                Signed in as {session?.userDetail.name || session?.userDetail.email}
              </Text>
            </Box>
          </HStack>

          <HStack display={{ base: "none", md: "flex" }} gap={3}>
            {session?.organizerDetail.emailBrandingEnabled ? (
              <Badge rounded="full" px={3} py={1} bg="brand.50" color="brand.800" fontSize="xs" fontWeight="semibold">
                Branding enabled
              </Badge>
            ) : null}
            <Button variant="outline" rounded="full" borderColor="app.border" color="app.text" _hover={{ bg: "app.surfaceAlt" }}>
              Profile
            </Button>
            <Button onClick={signOut} rounded="full" bg="app.text" color="white" _hover={{ bg: "slate.800" }}>
              Sign out
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
