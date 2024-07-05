import React from "react";
import { BigNumber } from "ethers";
import { Button, Flex } from "@chakra-ui/react";
import { formatUnits } from "ethers/lib/utils";
import { QuickSelectProps } from "@/components/inputs/types";

const PercentOptions: React.FC<{
    setValue: QuickSelectProps["setValue"];
    name: string;
    max: BigNumber;
    decimals: number;
    percentages?: number[];
}> = ({ setValue, name, max, decimals, percentages = [25, 50, 75, 100] }) => {
    return (
        <Flex
            gap="2"
            sx={{
                "> *": {
                    flexGrow: "1",
                    flexBasis: "0",
                },
            }}
        >
            {percentages.map((p, idx) => (
                <Button
                    key={idx}
                    variant="outline"
                    colorScheme="gray"
                    color="gray.400"
                    size="sm"
                    onClick={() =>
                        setValue(
                            name,
                            formatUnits(max.mul(p).div(100), decimals),
                            {
                                shouldValidate: true,
                            }
                        )
                    }
                >
                    {p}%
                </Button>
            ))}
        </Flex>
    );
};

export default PercentOptions;
