import { PriceUpdate } from "../../../assets/events/price-update.event";
import Decimal from "decimal.js";
import { PriceSource } from "../../../assets/entities/price-source.entity"

interface PriceEntryFactoryOptions {
    usdValue?: string | number | Decimal;
    value?: string | number | Decimal;
    at?: Date;
}

export const priceUpdateFactory = (ps: PriceSource, options?: PriceEntryFactoryOptions) => {
    const pu = new PriceUpdate(
        ps,
        options?.at ?? new Date(),
        new Decimal(options?.value ?? Math.random() * 100),
        new Decimal(options?.usdValue ?? Math.random() * 100)
    )
    return pu
}