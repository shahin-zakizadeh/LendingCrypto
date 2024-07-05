import { Icon, IconProps } from "@chakra-ui/react";
import * as React from "react";

const AccountIcon = (props: IconProps) => (
    <Icon
        viewBox="0 0 32 32"
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
            d="M588.409 463.011c-19.587-27.763-31.096-61.625-31.096-98.153 0-94.125 76.417-170.543 170.542-170.543s170.543 76.418 170.543 170.543c0 36.528-11.509 70.39-31.096 98.153-26.198-50.321-78.837-84.716-139.447-84.716-60.609 0-113.249 34.395-139.446 84.716Z"
            style={{
                fill: "#b6b6b6",
            }}
            transform="matrix(.09382 0 0 .09382 -52.286 -18.23)"
        />
        <path
            d="M582.207 465.078c26.198-50.32 78.837-84.716 139.447-84.716 60.609 0 113.249 34.396 139.446 84.716-30.883 43.776-81.85 72.39-139.446 72.39-57.597 0-108.563-28.614-139.447-72.39Z"
            style={{
                fill: "#707070",
            }}
            transform="matrix(.09382 0 0 .09382 -51.704 -18.424)"
        />
        <circle
            cx={823.979}
            cy={576.744}
            r={157.106}
            style={{
                fill: "#707070",
            }}
            transform="matrix(.0352 0 0 .0352 -13.009 -9.445)"
        />
    </Icon>
);

export default AccountIcon;
