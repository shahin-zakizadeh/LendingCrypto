import React, { FunctionComponent } from "react";
import { Flex, Stack, Text } from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";

interface OwnProps {
    data: {
        label: string;
        values: (React.ReactNode | null)[];
    }[];
}

type Props = OwnProps;

const InfoDisplay: FunctionComponent<Props> = ({ data }) => {
    return (
        <Stack px="3" pt="2">
            {data.map((d, i) => (
                <Flex justify="space-between" key={i}>
                    <Text color="gray.400">{d.label}</Text>

                    <Flex align="center">
                        {(
                            d.values.filter(
                                (v) => v !== null
                            ) as React.ReactNode[]
                        ).map((v, idx, arr) => (
                            <React.Fragment key={idx}>
                                <Text as="span" minW="14" textAlign="end">
                                    {v}
                                </Text>

                                {idx !== arr.length - 1 && (
                                    <ChevronRightIcon
                                        h="6"
                                        w="6"
                                        color="gray"
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </Flex>
                </Flex>
            ))}
        </Stack>
    );
};

export default InfoDisplay;
