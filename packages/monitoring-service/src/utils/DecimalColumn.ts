import Decimal from "decimal.js";
import { ColumnOptions } from "typeorm";

interface DecimalColumnTypeOptions {
    precision?: number;
    scale?: number;
    default?: string;
}

export const decimalColumnType = (options?: DecimalColumnTypeOptions) => ({
    type: 'numeric',
    precision: options?.precision ?? 78,
    scale: options?.scale ?? 18,
    default: options?.default,
    transformer: {
        from: (value: string) => new Decimal(value),
        to: (decimal: Decimal) => decimal?.toString()
    }
}) as ColumnOptions