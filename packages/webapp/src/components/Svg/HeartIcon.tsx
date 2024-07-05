import * as React from "react";
import { Icon, IconProps } from "@chakra-ui/react";

const HeartIcon = (props: IconProps) => (
    <Icon
        width="1em"
        height="1em"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M21.255 12.277 12.51 21.09l-8.746-8.814A5.94 5.94 0 0 1 2.43 10.26a6.026 6.026 0 0 1 .123-4.758A5.925 5.925 0 0 1 3.99 3.56a5.804 5.804 0 0 1 2.082-1.193 5.734 5.734 0 0 1 4.65.505 5.864 5.864 0 0 1 1.788 1.613 5.863 5.863 0 0 1 1.79-1.599 5.735 5.735 0 0 1 4.638-.49c.765.249 1.47.654 2.074 1.192a5.925 5.925 0 0 1 1.433 1.936 6.02 6.02 0 0 1-1.19 6.76"
            stroke="#51C2E4"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Icon>
);

export default HeartIcon;
