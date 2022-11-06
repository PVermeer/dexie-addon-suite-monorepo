import { mapBinaryToValues, mapValuesToBinary } from "./utils";

export function mapToBinaryOnCreation(document: Record<string, unknown>): Record<string, unknown> {

    if (!document) { return document; }

    return mapValuesToBinary(document);
}

export function mapToBinaryOnUpdating(changes: Record<string, unknown>): Record<string, unknown> {

    if (!changes) { return changes; }

    return mapValuesToBinary(changes);
}

export function mapBinaryToValueOnReading(document: Record<string, unknown>): Record<string, unknown> {

    if (!document) { return document; }

    return mapBinaryToValues(document);
}
