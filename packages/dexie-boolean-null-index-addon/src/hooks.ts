import { IndexValueEncoder } from "./index-value-encoder.class";

const indexValueEncoder = IndexValueEncoder.Get();

export function mapToBinaryOnCreation(document: Record<string, unknown>): Record<string, unknown> {

    if (!document) { return document; }

    return indexValueEncoder.mapValuesToBinary(document);
}

export function mapToBinaryOnUpdating(changes: Record<string, unknown>): Record<string, unknown> {

    if (!changes) { return changes; }

    return indexValueEncoder.mapValuesToBinary(changes);
}

export function mapBinaryToValueOnReading(document: Record<string, unknown>): Record<string, unknown> {

    if (!document) { return document; }

    return indexValueEncoder.mapBinaryToValues(document);
}
