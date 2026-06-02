export function schemaNodeType(schema: any): string {
  if (!schema) return 'unknown';
  if (schema.type) return schema.type;
  if (schema.properties || schema.additionalProperties) return 'object';
  if (schema.items) return 'array';
  return 'unknown';
}

export function schemaProperties(schema: any): Record<string, any> {
  if (!schema) return {};
  if (schema.properties && Object.keys(schema.properties).length > 0) return schema.properties;
  if (schema.items?.properties && Object.keys(schema.items.properties).length > 0)
    return schema.items.properties;
  return {};
}

export function schemaHasChildren(schema: any): boolean {
  return Object.keys(schemaProperties(schema)).length > 0;
}
