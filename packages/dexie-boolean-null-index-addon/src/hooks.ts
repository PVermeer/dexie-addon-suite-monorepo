import { mapBinaryToValues, mapValuesToBinary } from "./utils";

export function mapToStringOnCreation(document: Record<string, unknown>): Record<string, unknown> {

    if (!document) { return document; }

    return mapValuesToBinary(document);
}

export function mapToStringOnUpdating(changes: Record<string, unknown>): Record<string, unknown> {

    if (!changes) { return changes; }

    return mapValuesToBinary(changes);
}

export function mapStringToValueOnReading(document: Record<string, unknown>): Record<string, unknown> {

    if (!document) { return document; }

    return mapBinaryToValues(document);
}
