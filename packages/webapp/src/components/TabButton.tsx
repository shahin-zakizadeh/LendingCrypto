import { Button, ButtonProps, useTab } from "@chakra-ui/react";
import React from "react";

const TabButton = React.forwardRef<HTMLElement, ButtonProps>((props, ref) => {
    const tabProps = useTab({ ...props, ref });
    const isSelected = Boolean(tabProps["aria-selected"]);

    return (
        <Button
            {...tabProps}
            size="sm"
            variant={isSelected ? "solid" : "secondary"}
            px="3"
        >
            {tabProps.children}
        </Button>
    );
});

export default TabButton;
