import { useState } from "react";
import { Badge, Box, Button, Container, Heading, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useAuth } from "../AuthContext";
import { PasswordInput } from "../../../shared/components/inputs/PasswordInput/PasswordInput";

export function LoginScreen() {
  const { status, loginError, pendingChallenge, signIn, verifyTwoFactor } = useAuth();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");

  const isSubmitting = status === "loading";
  const isTwoFactorStep = status === "pending-2fa" && pendingChallenge;

  return (
    <Box
      position="relative"
      minH="100vh"
      overflow="hidden"
      bgGradient="linear(180deg, #f7fbff 0%, #edf5ff 100%)"
      color="slate.900"
    >
      <Box pointerEvents="none" position="absolute" inset={0}>
        <Box
          position="absolute"
          left="50%"
          top="-8rem"
          h="32rem"
          w="32rem"
          transform="translateX(-50%)"
          rounded="full"
          bg="cyan.200"
          filter="blur(96px)"
          opacity={0.55}
        />
        <Box
          position="absolute"
          right="-10rem"
          top="25%"
          h="20rem"
          w="20rem"
          rounded="full"
          bg="indigo.100"
          filter="blur(96px)"
          opacity={0.7}
        />
      </Box>

      <Container position="relative" maxW="7xl" py={{ base: 10, lg: 16 }} px={{ base: 4, sm: 6, lg: 8 }}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 10, xl: 16 }} alignItems="center" minH="100vh">
          <Stack gap={8} maxW="2xl">
            <Badge
              alignSelf="flex-start"
              rounded="full"
              px={4}
              py={2}
              bg="cyan.50"
              color="cyan.800"
              borderWidth="1px"
              borderColor="cyan.100"
              fontSize="sm"
              fontWeight="semibold"
              letterSpacing="0.02em"
            >
              Secure access for membership operations
            </Badge>

            <Stack gap={5}>
              <Heading as="h1" size="4xl" lineHeight="0.95" letterSpacing="-0.04em">
                Sign in to manage members, billing, and operations.
              </Heading>
              <Text fontSize={{ base: "md", lg: "lg" }} lineHeight="1.8" color="slate.600" maxW="xl">
                The application stays protected until a user is authenticated. If 2FA is enabled, we guide them through that step before
                unlocking the dashboard.
              </Text>
            </Stack>

            <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
              {["JWT + refresh token flow", "2FA verification support", "Protected app shell"].map((item) => (
                <Box
                  key={item}
                  rounded="3xl"
                  borderWidth="1px"
                  borderColor="slate.200"
                  bg="whiteAlpha.800"
                  px={4}
                  py={5}
                  shadow="sm"
                  backdropFilter="blur(16px)"
                >
                  <Text fontSize="sm" color="slate.700" lineHeight="1.7">
                    {item}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>

          <Box
            rounded="3xl"
            borderWidth="1px"
            borderColor="slate.200"
            bg="whiteAlpha.900"
            p={{ base: 6, sm: 8 }}
            shadow="2xl"
            shadowColor="slate.200"
            backdropFilter="blur(20px)"
          >
            <Stack gap={6}>
              <Stack direction="row" alignItems="start" justifyContent="space-between" gap={4}>
                <Stack gap={1}>
                  <Text fontSize="sm" color="slate.500">
                    Welcome back
                  </Text>
                  <Heading as="h2" size="xl" letterSpacing="-0.03em">
                    {isTwoFactorStep ? "Verify your code" : "Sign in to continue"}
                  </Heading>
                </Stack>
                <Badge rounded="full" px={3} py={1} bg="cyan.50" color="cyan.800" fontSize="xs" fontWeight="semibold">
                  Protected
                </Badge>
              </Stack>

              {loginError ? (
                <Box rounded="2xl" borderWidth="1px" borderColor="red.200" bg="red.50" px={4} py={3} color="red.700">
                  <Text fontSize="sm" fontWeight="medium">
                    {loginError}
                  </Text>
                </Box>
              ) : null}

              {!isTwoFactorStep ? (
                <Stack
                  as="form"
                  gap={4}
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await signIn(userName, password);
                  }}
                >
                  <Box as="label" display="grid" gap={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="slate.700">
                      Email address
                    </Text>
                    <Input
                      id="login-email"
                      type="email"
                      value={userName}
                      onChange={(event) => setUserName(event.target.value)}
                      required
                      autoComplete="email"
                      placeholder="name@company.com"
                      px={4}
                      py={3}
                      rounded="xl"
                      borderWidth="1px"
                      borderColor="slate.200"
                      bg="slate.50"
                      color="slate.900"
                      outline="none"
                      transition="all 0.2s ease"
                      _placeholder={{ color: "slate.400" }}
                      _focusVisible={{
                        borderColor: "cyan.500",
                        boxShadow: "0 0 0 4px rgba(34, 211, 238, 0.18)",
                      }}
                    />
                  </Box>

                  <Box as="label" display="grid" gap={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="slate.700">
                      Password
                    </Text>
                    <PasswordInput
                      id="login-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                    />
                  </Box>

                  <Button
                    type="submit"
                    loading={isSubmitting}
                    loadingText="Signing in"
                    w="full"
                    rounded="xl"
                    bg="slate.900"
                    color="white"
                    py={3}
                    fontSize="sm"
                    fontWeight="semibold"
                    _hover={{ bg: "slate.800" }}
                    _active={{ bg: "slate.950" }}
                  >
                    Sign in
                  </Button>
                </Stack>
              ) : (
                <Stack
                  as="form"
                  gap={4}
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await verifyTwoFactor(emailCode);
                  }}
                >
                  <Box as="label" display="grid" gap={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="slate.700">
                      Email code
                    </Text>
                    <Input
                      id="login-code"
                      type="text"
                      value={emailCode}
                      onChange={(event) => setEmailCode(event.target.value)}
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter the code sent to your email"
                      px={4}
                      py={3}
                      rounded="xl"
                      borderWidth="1px"
                      borderColor="slate.200"
                      bg="slate.50"
                      color="slate.900"
                      outline="none"
                      transition="all 0.2s ease"
                      _placeholder={{ color: "slate.400" }}
                      _focusVisible={{
                        borderColor: "cyan.500",
                        boxShadow: "0 0 0 4px rgba(34, 211, 238, 0.18)",
                      }}
                    />
                  </Box>

                  <Button
                    type="submit"
                    loading={isSubmitting}
                    loadingText="Verifying"
                    w="full"
                    rounded="xl"
                    bg="slate.900"
                    color="white"
                    py={3}
                    fontSize="sm"
                    fontWeight="semibold"
                    _hover={{ bg: "slate.800" }}
                    _active={{ bg: "slate.950" }}
                  >
                    Verify code
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
