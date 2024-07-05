import { Icon, IconProps } from "@chakra-ui/react";
import * as React from "react";
import { SVGProps } from "react";

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
        <path
            style={{
                fill: "none",
            }}
            d="M1475 2680h201v182h-201z"
            transform="matrix(.1194 0 0 .13187 -176.12 -353.41)"
        />
        <circle
            cx={1616.82}
            cy={2692}
            r={12}
            style={{
                fill: "#6983ee",
            }}
            transform="translate(-1604.825 -2679.997)"
        />
        <path
            d="m392.07 0 .115 472.382L784.13 650.54 392.07 0Z"
            style={{
                fill: "#fff",
                fillOpacity: 0.68,
                fillRule: "nonzero",
            }}
            transform="translate(6.598 2.996) scale(.01377)"
        />
        <path
            d="M392.07 0 0 650.54l392.07-178.21V0Z"
            style={{
                fill: "#fff",
                fillRule: "nonzero",
            }}
            transform="translate(6.598 2.996) scale(.01377)"
        />
        <path
            d="M392.07 956.52v320.86l392.3-552.49-392.3 231.63Z"
            style={{
                fill: "#fff",
                fillOpacity: 0.6,
                fillRule: "nonzero",
            }}
            transform="translate(6.598 2.996) scale(.01377)"
        />
        <path
            d="M392.07 1277.38V956.52L0 724.89l392.07 552.49Z"
            style={{
                fill: "#fff",
                fillRule: "nonzero",
            }}
            transform="translate(6.598 2.996) scale(.01377)"
        />
        <path
            d="m392.07 882.29 392.06-231.75-392.06-178.21v409.96Z"
            style={{
                fill: "#fff",
                fillOpacity: 0.39,
                fillRule: "nonzero",
            }}
            transform="translate(6.598 2.996) scale(.01377)"
        />
        <path
            d="m0 650.54 392.07 231.75V472.33L0 650.54Z"
            style={{
                fill: "#fff",
                fillOpacity: 0.67,
                fillRule: "nonzero",
            }}
            transform="translate(6.598 2.996) scale(.01377)"
        />
    </Icon>
);

export default SvgComponent;
