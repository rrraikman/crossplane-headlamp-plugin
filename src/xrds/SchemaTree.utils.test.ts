import { describe, expect, test } from 'vitest';
import { schemaHasChildren, schemaNodeType, schemaProperties } from './SchemaTree.utils';

describe('schemaNodeType', () => {
  test('returns "unknown" for null', () => {
    expect(schemaNodeType(null)).toBe('unknown');
  });

  test('returns "unknown" for undefined', () => {
    expect(schemaNodeType(undefined)).toBe('unknown');
  });

  test('returns the explicit type when present', () => {
    expect(schemaNodeType({ type: 'string' })).toBe('string');
    expect(schemaNodeType({ type: 'integer' })).toBe('integer');
    expect(schemaNodeType({ type: 'boolean' })).toBe('boolean');
  });

  test('returns "object" when properties present but no type', () => {
    expect(schemaNodeType({ properties: { foo: {} } })).toBe('object');
  });

  test('returns "object" when additionalProperties present but no type', () => {
    expect(schemaNodeType({ additionalProperties: { type: 'string' } })).toBe('object');
  });

  test('returns "array" when items present but no type', () => {
    expect(schemaNodeType({ items: { type: 'string' } })).toBe('array');
  });

  test('returns "unknown" for empty schema', () => {
    expect(schemaNodeType({})).toBe('unknown');
  });

  test('prefers explicit type over structural inference', () => {
    expect(schemaNodeType({ type: 'array', properties: {} })).toBe('array');
  });
});

describe('schemaProperties', () => {
  test('returns {} for null', () => {
    expect(schemaProperties(null)).toEqual({});
  });

  test('returns {} for undefined', () => {
    expect(schemaProperties(undefined)).toEqual({});
  });

  test('returns {} for schema with no properties', () => {
    expect(schemaProperties({ type: 'string' })).toEqual({});
  });

  test('returns {} for schema with empty properties object', () => {
    expect(schemaProperties({ type: 'object', properties: {} })).toEqual({});
  });

  test('returns direct properties when present', () => {
    const props = { region: { type: 'string' }, size: { type: 'integer' } };
    expect(schemaProperties({ type: 'object', properties: props })).toEqual(props);
  });

  test('returns items.properties for array schema', () => {
    const itemProps = { name: { type: 'string' } };
    expect(schemaProperties({ type: 'array', items: { properties: itemProps } })).toEqual(itemProps);
  });

  test('returns {} when items has no properties', () => {
    expect(schemaProperties({ type: 'array', items: { type: 'string' } })).toEqual({});
  });

  test('prefers direct properties over items.properties', () => {
    const directProps = { foo: { type: 'string' } };
    const itemProps = { bar: { type: 'integer' } };
    expect(
      schemaProperties({ properties: directProps, items: { properties: itemProps } })
    ).toEqual(directProps);
  });
});

describe('schemaHasChildren', () => {
  test('returns false for null', () => {
    expect(schemaHasChildren(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(schemaHasChildren(undefined)).toBe(false);
  });

  test('returns false for schema with no properties', () => {
    expect(schemaHasChildren({ type: 'string' })).toBe(false);
  });

  test('returns false for schema with empty properties', () => {
    expect(schemaHasChildren({ type: 'object', properties: {} })).toBe(false);
  });

  test('returns true for schema with properties', () => {
    expect(schemaHasChildren({ type: 'object', properties: { foo: {} } })).toBe(true);
  });

  test('returns true for array schema with items.properties', () => {
    expect(schemaHasChildren({ type: 'array', items: { properties: { bar: {} } } })).toBe(true);
  });
});
