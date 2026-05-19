import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Box, Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useAuth } from "../../features/auth/AuthContext";
import { LoginScreen } from "../../features/auth/components/LoginScreen";
import { APP_ROUTES } from "./routes";

export function AppLoading() {
  return (
    <Center minH="100vh" bg="slate.50" color="slate.900" px={4}>
      <Stack gap={4} align="center" textAlign="center">
        <Box rounded="full" borderWidth="1px" borderColor="cyan.200" bg="cyan.50" p={3} shadow="sm">
          <Spinner color="cyan.600" size="lg" />
        </Box>
        <Text fontSize="sm" color="slate.500">
          Loading authentication state...
        </Text>
      </Stack>
    </Center>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (status !== "authenticated") {
    return <Navigate to={APP_ROUTES.login} replace state={{ from: location }} />;
  }

  return children;
}

export function LoginRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (status === "authenticated") {
    return <Navigate to={APP_ROUTES.membershipDashboard} replace />;
  }

  return <LoginScreen />;
}
