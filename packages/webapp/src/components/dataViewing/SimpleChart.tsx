import React, { useCallback, useMemo } from "react";
import { AreaClosed, Bar, Line } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { scaleLinear, scaleTime } from "@visx/scale";
import {
    defaultStyles,
    Tooltip,
    TooltipWithBounds,
    withTooltip,
} from "@visx/tooltip";
import { WithTooltipProvidedProps } from "@visx/tooltip/lib/enhancers/withTooltip";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import { bisector, extent, max } from "d3-array";
import { timeFormat } from "d3-time-format";
import theme from "@/theme/index";

type Data = {
    date: string;
    value: number;
};

type TooltipData = Data;

const sampleData: Data[] = [
    {
        date: "2020-01-01",
        value: 100,
    },
    {
        date: "2020-01-02",
        value: 200,
    },
    {
        date: "2020-01-03",
        value: 300,
    },
    {
        date: "2020-01-04",
        value: 250,
    },
    {
        date: "2020-01-05",
        value: 230,
    },
    {
        date: "2020-01-06",
        value: 320,
    },
];

const sampleData2: Data[] = [
    {
        date: "2020-01-01",
        value: 130,
    },
    {
        date: "2020-01-02",
        value: 240,
    },
    {
        date: "2020-01-03",
        value: 100,
    },
    {
        date: "2020-01-04",
        value: 230,
    },
    {
        date: "2020-01-05",
        value: 240,
    },
    {
        date: "2020-01-06",
        value: 300,
    },
];

export const background = theme.colors.bg;
export const background2 = theme.colors.bg;
export const accentColor = theme.colors.primary[500];
export const accentColorDark = theme.colors.primary[700];
const tooltipStyles = {
    ...defaultStyles,
    background,
    border: "1px solid white",
    color: "white",
};

// util
const formatDate = timeFormat("%b %d, '%y");

// accessors
const getDate = (d: Data) => new Date(d.date);
const getStockValue = (d: Data) => d.value;
const bisectDate = bisector<Data, Date>((d) => new Date(d.date)).left;

export type ChartProps = {
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
    data: Data[][];
};

export default withTooltip<ChartProps, TooltipData>(
    ({
        width,
        height,
        margin = { top: 0, right: 0, bottom: 0, left: 0 },
        showTooltip,
        hideTooltip,
        tooltipData,
        tooltipTop = 0,
        tooltipLeft = 0,
        data = [sampleData, sampleData2],
    }: ChartProps & WithTooltipProvidedProps<TooltipData>) => {
        if (width < 10) return null;

        // bounds
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const fullDataConcat = useMemo(
            () => data.reduce((acc, cur) => acc.concat(cur), []),
            [data]
        );

        // scales
        const dateScale = useMemo(
            () =>
                scaleTime({
                    range: [margin.left, innerWidth + margin.left],
                    domain: extent(fullDataConcat, getDate) as [Date, Date],
                }),
            [innerWidth, margin.left]
        );
        const dataValueScale = useMemo(
            () =>
                scaleLinear({
                    range: [innerHeight + margin.top, margin.top],
                    domain: [
                        0,
                        (max(fullDataConcat, getStockValue) || 0) +
                            innerHeight / 3,
                    ],
                    nice: true,
                }),
            [margin.top, innerHeight]
        );

        const [hoverMarkersY, setHoverMarkersY] = React.useState<number[]>([]);

        // tooltip handler
        const handleTooltip = useCallback(
            (
                event:
                    | React.TouchEvent<SVGRectElement>
                    | React.MouseEvent<SVGRectElement>
            ) => {
                const { x } = localPoint(event) || { x: 0 };
                const x0 = dateScale.invert(x);
                const index = bisectDate(data[0], x0, 1);
                const d0 = data[0][index - 1];
                const d1 = data[0][index];
                let d = d0;
                if (d1 && getDate(d1)) {
                    d =
                        x0.valueOf() - getDate(d0).valueOf() >
                        getDate(d1).valueOf() - x0.valueOf()
                            ? d1
                            : d0;
                }
                let markers: number[] = [];
                data.map((dataArray) => {
                    const markerD0 = dataArray[index - 1];
                    const markerD1 = dataArray[index];
                    let markerD = markerD0;
                    if (markerD1 && getDate(markerD1)) {
                        markerD =
                            x0.valueOf() - getDate(d0).valueOf() >
                            getDate(markerD1).valueOf() - x0.valueOf()
                                ? markerD1
                                : markerD0;
                    }
                    markers.push(dataValueScale(getStockValue(markerD)));
                });
                setHoverMarkersY(markers);

                showTooltip({
                    tooltipData: d,
                    tooltipLeft: x,
                    tooltipTop: dataValueScale(getStockValue(d)),
                });
            },
            [showTooltip, dataValueScale, dateScale]
        );

        return (
            <div>
                <svg width={width} height={height}>
                    <rect
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        fill="url(#area-background-gradient)"
                        rx={14}
                    />
                    <line
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={height}
                        rx={14}
                        height={height}
                        stroke={theme.colors.gray[700]}
                        strokeWidth={2}
                    />
                    <LinearGradient
                        id="area-gradient"
                        from={accentColor}
                        to={accentColor}
                        fromOpacity={0.5}
                        toOpacity={0}
                    />
                    <GridRows
                        left={margin.left}
                        scale={dataValueScale}
                        width={innerWidth}
                        strokeDasharray="1,3"
                        stroke={accentColor}
                        strokeOpacity={0}
                        pointerEvents="none"
                    />
                    {data.map((dataArray, i) => (
                        <AreaClosed<Data>
                            key={i}
                            data={dataArray}
                            x={(d) => dateScale(getDate(d)) ?? 0}
                            y={(d) => dataValueScale(getStockValue(d)) ?? 0}
                            yScale={dataValueScale}
                            strokeWidth={2}
                            stroke={accentColor}
                            fill="url(#area-gradient)"
                            curve={curveMonotoneX}
                        />
                    ))}
                    <Bar
                        x={margin.left}
                        y={margin.top}
                        width={innerWidth}
                        height={innerHeight}
                        fill="transparent"
                        rx={14}
                        onTouchStart={handleTooltip}
                        onTouchMove={handleTooltip}
                        onMouseMove={handleTooltip}
                        onMouseLeave={() => hideTooltip()}
                    />
                    {tooltipData && (
                        <g>
                            <Line
                                from={{ x: tooltipLeft, y: margin.top }}
                                to={{
                                    x: tooltipLeft,
                                    y: innerHeight + margin.top,
                                }}
                                stroke={accentColorDark}
                                strokeWidth={2}
                                pointerEvents="none"
                                strokeDasharray="5,2"
                            />
                            {hoverMarkersY.map((y) => (
                                <>
                                    <circle
                                        cx={tooltipLeft}
                                        cy={y + 1}
                                        r={4}
                                        fill="black"
                                        fillOpacity={0.1}
                                        stroke="black"
                                        strokeOpacity={0.1}
                                        strokeWidth={2}
                                        pointerEvents="none"
                                    />
                                    <circle
                                        cx={tooltipLeft}
                                        cy={y}
                                        r={4}
                                        fill={accentColorDark}
                                        stroke="white"
                                        strokeWidth={2}
                                        pointerEvents="none"
                                    />
                                </>
                            ))}
                        </g>
                    )}
                </svg>
                {tooltipData && (
                    <div>
                        <TooltipWithBounds
                            key={Math.random()}
                            top={tooltipTop - 12}
                            left={tooltipLeft + 12}
                            style={tooltipStyles}
                        >
                            {`$${getStockValue(tooltipData)}`}
                            <br />
                            {`$${getStockValue(tooltipData)}`}
                        </TooltipWithBounds>
                        <Tooltip
                            top={innerHeight + margin.top - 14}
                            left={tooltipLeft}
                            style={{
                                ...defaultStyles,
                                minWidth: 72,
                                textAlign: "center",
                                transform: "translateX(-50%)",
                            }}
                        >
                            {formatDate(getDate(tooltipData))}
                        </Tooltip>
                    </div>
                )}
            </div>
        );
    }
);
