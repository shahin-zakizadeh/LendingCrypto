import { EventFilter } from "ethers";

export function mergeFilters(filters: EventFilter[]): EventFilter {
    const topics = filters
        .map((filter) => filter.topics)
        .reduce((acc, topics) => acc.concat(topics)) as string[];
    return {
        address: filters[0].address,
        topics: [topics]
    }
}