import * as React from "react";
import { SVGProps } from "react";

const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 826 327"
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
            d="M75.84 49.53c12.2 13.88 24.49 27.69 36.48 41.76 12.35-13.75 24.32-27.84 36.64-41.61-.08 19.56-.03 39.11-.2 58.66 21.58 3.3 43.1 8.9 62.41 19.29-15.04-4.68-30.6-7.41-46.16-9.71-2.68-.21-5.38-.38-8-1.01-7.53-.39-15.02-1.39-22.57-1.49.12-8.55-.18-17.1-.06-25.66-7.67 7.7-14.6 16.13-21.98 24.12-7.27-8.04-14.37-16.26-21.87-24.09.01 8.56-.12 17.12-.05 25.68-26.16 1.36-52.28 5.1-77.47 12.4 19.4-10.7 41.18-16.35 62.96-19.66-.29-19.56-.01-39.12-.13-58.68Z"
            style={{
                fillRule: "nonzero",
                fill: props.color ?? "currentcolor",
            }}
            transform="translate(-54.21 -206.375) scale(4.16667)"
        />
    </svg>
);

export default SvgComponent;
