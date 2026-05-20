import { useId, useState } from "react";
import { Box, Button, Input, type InputProps } from "@chakra-ui/react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputProps, "type">;

export function PasswordInput({ id, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  return (
    <Box position="relative" w="full">
      <Input
        id={inputId}
        {...props}
        type={isVisible ? "text" : "password"}
        pe="3rem"
        bg="app.surface"
        borderColor="app.border"
        borderRadius="xl"
        boxShadow="sm"
        color="app.text"
        _placeholder={{ color: "app.subtle" }}
        _focusVisible={{
          borderColor: "brand.500",
          boxShadow: "0 0 0 4px rgba(34, 211, 238, 0.16)",
        }}
      />
      <Button
        type="button"
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setIsVisible((current) => !current)}
        variant="ghost"
        size="sm"
        position="absolute"
        top="50%"
        right="0.25rem"
        transform="translateY(-50%)"
        minW="2.5rem"
        px="0"
        color="app.muted"
        _hover={{ color: "app.text", bg: "app.surfaceAlt" }}
      >
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </Button>
    </Box>
  );
}
