import { cardAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
    createMultiStyleConfigHelpers(cardAnatomy.keys);

const baseStyle = definePartsStyle({
    container: {
        backgroundColor: "rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(10px)",
        borderRadius: "24px",
    },
    header: {
        paddingTop: 3,
        paddingBottom: 0,
        px: 6,
    },
});

const Card = defineMultiStyleConfig({ baseStyle });
export default Card;
