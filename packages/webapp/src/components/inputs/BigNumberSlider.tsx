import { formatUnits } from "ethers/lib/utils";
import {
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { BigNumber } from "ethers";
import { QuickSelectProps } from "@/components/inputs/types";

const BigNumberSlider: React.FC<{
    setValue: QuickSelectProps["setValue"];
    name: string;
    value: BigNumber;
    decimals: number;
    max: BigNumber;
}> = ({ setValue, name, value, decimals, max }) => {
    const percent = useMemo(
        () =>
            value.gt(max)
                ? 100
                : value
                      .mul(100)
                      .div(max.eq(0) ? 1 : max)
                      .toNumber(),
        [value, value]
    );

    return (
        <Slider
            aria-label="slider-ex-1"
            defaultValue={30}
            value={percent}
            onChange={(val) => {
                setValue(
                    name,
                    formatUnits(max.mul(100).mul(val).div(10000), decimals),
                    {
                        shouldValidate: true,
                    }
                );
            }}
            focusThumbOnChange={false}
            // temporary fix for slider height, which flickers on tabs change
            // see https://github.com/chakra-ui/chakra-ui/issues/6615
            sx={{
                paddingTop: "7px !important",
                paddingBottom: "7px !important",
            }}
        >
            <SliderTrack height="2px" bg="primary.800">
                <SliderFilledTrack bg="primary.500" />
            </SliderTrack>
            <SliderThumb bg="primary.300" />
        </Slider>
    );
};

export default BigNumberSlider;
