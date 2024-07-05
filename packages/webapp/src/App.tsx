import React, { useState } from "react";
import Providers from "./components/Providers";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { WagmiConfig } from "wagmi";
import { client } from "./connectors";

function App() {
    return (
        <WagmiConfig client={client}>
            <Providers>
                <RouterProvider router={router} />
            </Providers>
        </WagmiConfig>
    );
}

export default App;
