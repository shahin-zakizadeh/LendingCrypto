import { extendTheme, ThemeConfig } from "@chakra-ui/react";
import colors from "./colors";
import components from "./components";
import globalStyle from "./global";

const config: ThemeConfig = {
    initialColorMode: "dark",
    useSystemColorMode: false,
};

const theme = extendTheme({
    colors,
    styles: {
        global: globalStyle,
    },
    fonts: {
        body: '"Exo 2", system-ui, sans-serif',
        heading: '"Exo 2", system-ui, sans-serif',
        mono: "Menlo, monospace",
    },
    fontSizes: {
        xs: "0.75rem",
        sm: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.12rem",
        "2xl": "1.5rem",
        "3xl": "1.5rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
        "6xl": "3.75rem",
        "7xl": "4.5rem",
        "8xl": "6rem",
        "9xl": "8rem",
    },
    shadows: {
        glow: `0px 0px 7px 0px ${colors.primary["500"]}`,
    },
    components,
    config,
});

export default theme;
