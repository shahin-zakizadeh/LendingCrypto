import { tableAnatomy as parts } from "@chakra-ui/anatomy"
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { defineMultiStyleConfig, definePartsStyle } =
    createMultiStyleConfigHelpers(parts.keys)

const baseStyle = definePartsStyle({
    th: {
        whiteSpace: "normal",
        verticalAlign: "bottom",
        textTransform: "none",
        fontWeight: "normal"
    },
})

const sizes = {
    sm: definePartsStyle({
        th: {
            paddingTop: "1",
            paddingBottom: "2",
            fontSize: "sm",
        },
        td: {
            fontSize: "md",
        },
    }),
    md: definePartsStyle({
        th: {
            paddingTop: "1",
            paddingBottom: "2",
            fontSize: "sm",
        },
        td: {
            fontSize: "md",
        },
    })
}

const Table = defineMultiStyleConfig({
    baseStyle,
    // variants,
    sizes,
})

export default Table