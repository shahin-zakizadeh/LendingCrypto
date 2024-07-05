import { createBrowserRouter } from "react-router-dom";
import { dashboardPage } from "@/pages/dashboard/Dashboard";
import { oraclesPage } from "@/pages/dev/oracles";
import { tokenMintPage } from "@/pages/dev/TokenMint";
import { marketsPage } from "@/pages/markets/Markets";
import { userVaultsPage } from "@/pages/dashboard/UserVaults";

export const router = createBrowserRouter([
    dashboardPage,
    userVaultsPage,
    tokenMintPage,
    oraclesPage,
    marketsPage
])