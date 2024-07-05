import { Icon, IconProps } from "@chakra-ui/react";
import * as React from "react";

const SvgComponent = (props: IconProps) => (
    <Icon
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        style={{
            fillRule: "evenodd",
            clipRule: "evenodd",
            strokeLinejoin: "round",
            strokeMiterlimit: 2,
        }}
        {...props}
    >
        <g transform="matrix(.1194 0 0 .13187 -176.12 -353.41)">
            <path
                style={{
                    fill: "none",
                }}
                d="M1475 2680h201v182h-201z"
            />
            <g>
                <g transform="matrix(6.09091 0 0 5.51515 1475 2680)">
                    <clipPath id="b">
                        <path d="M0 0h33v33H0z" />
                    </clipPath>
                </g>
                <circle
                    cx={16.25}
                    cy={16.25}
                    r={16.25}
                    style={{
                        fill: "#8247e5",
                    }}
                    transform="matrix(6.18462 0 0 5.6 1475 2680)"
                />
                <path
                    style={{
                        fill: "none",
                    }}
                    d="M3 1h32.5v32.5H3z"
                    transform="matrix(6.18462 0 0 5.6 1456.45 2674.4)"
                />
                <path
                    d="M29 10.2c-.7-.4-1.6-.4-2.4 0L21 13.5l-3.8 2.1-5.5 3.3c-.7.4-1.6.4-2.4 0L5 16.3c-.7-.4-1.2-1.2-1.2-2.1v-5c0-.8.4-1.6 1.2-2.1l4.3-2.5c.7-.4 1.6-.4 2.4 0L16 7.2c.7.4 1.2 1.2 1.2 2.1v3.3l3.8-2.2V7c0-.8-.4-1.6-1.2-2.1l-8-4.7c-.7-.4-1.6-.4-2.4 0L1.2 5C.4 5.4 0 6.2 0 7v9.4c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.4 0l5.5-3.2 3.8-2.2 5.5-3.2c.7-.4 1.6-.4 2.4 0l4.3 2.5c.7.4 1.2 1.2 1.2 2.1v5c0 .8-.4 1.6-1.2 2.1L29 28.8c-.7.4-1.6.4-2.4 0l-4.3-2.5c-.7-.4-1.2-1.2-1.2-2.1V21l-3.8 2.2v3.3c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.4 0l8.1-4.7c.7-.4 1.2-1.2 1.2-2.1V17c0-.8-.4-1.6-1.2-2.1L29 10.2Z"
                    style={{
                        fill: "#fff",
                        fillRule: "nonzero",
                    }}
                    transform="matrix(3.79474 0 0 3.43603 1502.83 2713.45)"
                />
            </g>
        </g>
    </Icon>
);

export default SvgComponent;
