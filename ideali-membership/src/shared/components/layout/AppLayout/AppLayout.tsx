import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "../Footer/Footer";
import { SideNav } from "../SideNav/SideNav";
import { TopBar } from "../TopBar/TopBar";
import { APP_ROUTES } from "../../../../routes";

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isCustomFormBuilderRoute =
    location.pathname.startsWith(APP_ROUTES.customFormsCreate) ||
    /^\/organizer\/custom-form\/[0-9a-fA-F-]{36}\/edit$/.test(location.pathname);
  const [isNavVisible, setIsNavVisible] = useState(!isCustomFormBuilderRoute);

  useEffect(() => {
    if (isCustomFormBuilderRoute) {
      setIsNavVisible(false);
    }
  }, [isCustomFormBuilderRoute]);

  return (
    <Flex minH="100vh" direction="column" overflowX="hidden" bgGradient="linear(180deg, #f8fbff 0%, #eef6ff 100%)" color="slate.900">
      <TopBar isNavVisible={isNavVisible} onNavToggle={() => setIsNavVisible((current) => !current)} />

      <Box flex="1" px={{ base: 4, sm: 6, xl: 10 }} py={{ base: 6, lg: 8 }}>
        <Flex gap={{ base: 4, xl: 8 }} align="stretch" overflowX="hidden">
          {isNavVisible ? (
            <SideNav
              onNavigate={() => {
                if (window.innerWidth < 1024 || isCustomFormBuilderRoute) {
                  setIsNavVisible(false);
                }
              }}
            />
          ) : null}

          <Box as="main" minW={0} flex="1" display="grid" gap={{ base: 6, xl: 8 }}>
            {children ?? <Outlet />}
          </Box>
        </Flex>
      </Box>

      <Footer />
    </Flex>
  );
}
