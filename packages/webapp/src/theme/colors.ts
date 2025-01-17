const chakraColors = {
    gray: {
        "50": "#f9fafa",
        "100": "#f0f1f2",
        "200": "#e6e8e9",
        "300": "#d1d4d7",
        "400": "#a7adb2",
        "500": "#778087",
        "600": "#4a565f",
        "700": "#2a3843",
        "800": "#182128",
        "900": "#131a20",
    },
    cyan: {
        "50": "#f4fbfd",
        "100": "#cfeff8",
        "200": "#b9e7f4",
        "300": "#9fdef0",
        "400": "#50c2e2",
        "500": "#4ab2d0",
        "600": "#42a1bb",
        "700": "#37859b",
        "800": "#2d6d7f",
        "900": "#235462",
    },
    blue: {
        "50": "#f1f6fd",
        "100": "#cce0f7",
        "200": "#a7c8f1",
        "300": "#7eafeb",
        "400": "#5696e5",
        "500": "#4781c7",
        "600": "#3b6ca7",
        "700": "#2d5280",
        "800": "#254368",
        "900": "#1e3755",
    },
    purple: {
        "50": "#f9f6fe",
        "100": "#e6daf9",
        "200": "#d3bef5",
        "300": "#b795ef",
        "400": "#a378ea",
        "500": "#8951e3",
        "600": "#7243be",
        "700": "#5d379c",
        "800": "#4d2d7f",
        "900": "#39215e",
    },
    pink: {
        "50": "#fdf5f9",
        "100": "#f9d8e7",
        "200": "#f4b8d3",
        "300": "#ed8cb8",
        "400": "#e869a2",
        "500": "#ce4985",
        "600": "#b13f72",
        "700": "#90335d",
        "800": "#702848",
        "900": "#521d35",
    },
    red: {
        "50": "#fdf5f5",
        "100": "#f9d9d7",
        "200": "#f3b7b4",
        "300": "#ec8b86",
        "400": "#e8706a",
        "500": "#d4524b",
        "600": "#b34540",
        "700": "#903833",
        "800": "#7a2f2b",
        "900": "#58221f",
    },
    orange: {
        "50": "#fefaf5",
        "100": "#f9ebda",
        "200": "#f2d4ae",
        "300": "#e9b26e",
        "400": "#d3964b",
        "500": "#b68141",
        "600": "#996d36",
        "700": "#7a572b",
        "800": "#604422",
        "900": "#4f381c",
    },
    yellow: {
        "50": "#fefefb",
        "100": "#fcf9e9",
        "200": "#f5eebd",
        "300": "#ede189",
        "400": "#dece4f",
        "500": "#b7a941",
        "600": "#928734",
        "700": "#726a29",
        "800": "#554f1e",
        "900": "#464119",
    },
    green: {
        "50": "#f4fdf9",
        "100": "#c3f6df",
        "200": "#7beab8",
        "300": "#4cd598",
        "400": "#42bb85",
        "500": "#39a072",
        "600": "#2f855e",
        "700": "#256749",
        "800": "#1e543c",
        "900": "#194531",
    },
    teal: {
        "50": "#f0fcfd",
        "100": "#bcf2f5",
        "200": "#7be5ea",
        "300": "#4cd0d6",
        "400": "#41b0b6",
        "500": "#37969b",
        "600": "#2d7a7e",
        "700": "#235f62",
        "800": "#1d4f51",
        "900": "#184143",
    },
};

const miscColors = {
    black: "#020304",
    bg: "#0E212E",
    disabled: "rgba(213, 213, 213, 0.411)",
    disabledText: "#dddddd",
    primary: {
        "50": "#E9F7FC",
        "100": "#C1E9F5",
        "200": "#99DBEF",
        "300": "#72CDE9",
        "400": "#4AC0E3",
        "500": "#22B2DD",
        "600": "#1B8EB1",
        "700": "#156B84",
        "800": "#0E4758",
        "900": "#07242C",
    },
};

const gradients = {
    gradient: `linear-gradient(90deg, ${miscColors.primary["300"]} 0%, ${miscColors.primary["600"]} 100%)`,
    gradientActive: `linear-gradient(90deg, ${miscColors.primary["400"]} 0%, ${miscColors.primary["400"]} 100%)`,
};

const colors = {
    ...chakraColors,
    ...miscColors,
    ...gradients,
};

export default colors;
