import React, { FunctionComponent } from "react";
import { Text, TextProps } from "@chakra-ui/react";

const TextDivider: FunctionComponent<TextProps> = (props) => {
    return (
        <Text as="span" color="gray.600" fontWeight="medium" {...props}>
            {" | "}
        </Text>
    );
};

export default TextDivider;
