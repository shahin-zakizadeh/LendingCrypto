import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import RPCProvidersProvider from "./RPCProvider";
import { LCProvider } from "./LendincClubProvider";
import { QueryClient, QueryClientProvider } from "react-query";
import theme from "../theme";

const queryClient = new QueryClient();

export default function Providers(props: React.PropsWithChildren) {
    return (
        <ChakraProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
                <RPCProvidersProvider>
                    <LCProvider>{props.children}</LCProvider>
                </RPCProvidersProvider>
            </QueryClientProvider>
        </ChakraProvider>
    );
}
