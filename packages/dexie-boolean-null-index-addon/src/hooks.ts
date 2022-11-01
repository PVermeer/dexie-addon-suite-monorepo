import { mapStringToValues, mapValuesToString } from "./utils";

export function mapToStringOnCreation(document: Record<string, unknown>): Record<string, unknown> {

    if (!document) { return document; }

    return mapValuesToString(document);
}

export function mapToStringOnUpdating(changes: Record<string, unknown>): Record<string, unknown> {

    if (!changes) { return changes; }

    return mapValuesToString(changes);
}

export function mapStringToValueOnReading(document: Record<string, unknown>): Record<string, unknown> {

    if (!document) { return document; }

    return mapStringToValues(document);
}
