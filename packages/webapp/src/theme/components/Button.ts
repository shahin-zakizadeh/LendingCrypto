import { defineStyle, defineStyleConfig } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const solid = defineStyle({
    background: "gradient",
    color: "bg",
    fontWeight: "bold",
    zIndex: "1",
    overflow: "hidden",
    _disabled: {
        bg: "whiteAlpha.400",
        opacity: "initial",
        color: "blackAlpha.900",
        transition: "none",
        _hover: {
            bg: "whiteAlpha.400",
            boxShadow: "none",
            _before: {
                opacity: "0",
            },
        },
    },
    _hover: {
        background: "gradient",
        _disabled: {
            bg: "whiteAlpha.400",
        },
        _before: {
            opacity: "1",
        },
        boxShadow: "glow",
    },
    _active: {
        bg: "gradientActive",
    },
    _before: {
        content: '""',
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        bg: "gradientActive",
        opacity: "0",
        transition: "opacity 0.4s",
        zIndex: "-1",
    },
});

// button color must be set the same way as the above gradient button.
// this is so transitions between variants work properly.
const secondary = defineStyle({
    bg: "gray.500",
    color: "blackAlpha.900",
    zIndex: "1",
    letterSpacing: "0.2px",
    transition: "none",
    overflow: "hidden",
    _hover: {
        _before: {
            opacity: "0",
        },
    },
    _before: {
        content: '""',
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: "-1",
        bg: "gray.600",
        transition: "opacity 0.4s",
    },
});

const sm = defineStyle({
    paddingX: 2,
    height: 7,
    fontSize: "lg",
});

const lg = defineStyle({
    paddingY: 2,
    fontSize: "lg",
    height: "2.75rem",
});

const outline = defineStyle((props) => {
    const { colorScheme: c } = props;
    const borderColor = mode(`gray.200`, `whiteAlpha.300`)(props);
    return {
        border: "1.5px solid",
        borderColor: c === "gray" ? borderColor : "currentColor",
        ".chakra-button__group[data-attached][data-orientation=horizontal] > &:not(:last-of-type)":
            { marginEnd: "-1px" },
        ".chakra-button__group[data-attached][data-orientation=vertical] > &:not(:last-of-type)":
            { marginBottom: "-1px" },
    };
});

const Button = defineStyleConfig({
    baseStyle: {
        borderRadius: "md",
    },
    variants: {
        solid,
        secondary,
        outline,
    },
    sizes: {
        sm,
        lg,
    },
    defaultProps: {
        colorScheme: "primary",
    },
});

export default Button;
