import { Box, Container, Flex, Text } from "@chakra-ui/react";

export function Footer() {
  return (
    <Box as="footer" borderTopWidth="1px" borderColor="slate.200" bg="whiteAlpha.800">
      <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} py={5}>
        <Flex direction={{ base: "column", sm: "row" }} gap={3} justify="space-between" fontSize="sm" color="slate.500">
          <Text>(c) 2026 Ideali Membership. Built for production workflows.</Text>
          <Text>Responsive layout with top bar, side navigation, and footer.</Text>
        </Flex>
      </Container>
    </Box>
  );
}
