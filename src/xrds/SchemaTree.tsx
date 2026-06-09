import { Icon } from '@iconify/react';
import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import { useState } from 'react';
import { schemaHasChildren, schemaNodeType, schemaProperties } from './SchemaTree.utils';

interface SchemaNodeProps {
  name: string;
  schema: any;
  required?: boolean;
  depth?: number;
}

function SchemaNode({ name, schema, required = false, depth = 0 }: SchemaNodeProps) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = schemaHasChildren(schema);
  const type = schemaNodeType(schema);
  const childProps = schemaProperties(schema);
  const requiredChildren: string[] = Array.isArray(schema?.required)
    ? schema.required
    : Array.isArray(schema?.items?.required)
      ? schema.items.required
      : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.25, ml: depth * 2 }}>
        {hasChildren ? (
          <IconButton size="small" onClick={() => setOpen(o => !o)} sx={{ p: 0.25 }}>
            <Icon icon={open ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={16} />
          </IconButton>
        ) : (
          <Box sx={{ width: 24 }} />
        )}
        <Typography variant="body2" fontFamily="monospace" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Chip size="small" label={type} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
        {required && (
          <Chip
            size="small"
            label="required"
            color="warning"
            sx={{ height: 18, fontSize: '0.65rem' }}
          />
        )}
        {schema?.description && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
            {schema.description}
          </Typography>
        )}
      </Box>
      {hasChildren && (
        <Collapse in={open}>
          {Object.entries(childProps).map(([childName, childSchema]: [string, any]) => (
            <SchemaNode
              key={childName}
              name={childName}
              schema={childSchema}
              required={requiredChildren.includes(childName)}
              depth={depth + 1}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
}

interface SchemaTreeProps {
  schema: any;
}

export function SchemaTree({ schema }: SchemaTreeProps) {
  if (!schema) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        No schema defined
      </Typography>
    );
  }

  const properties = schemaProperties(schema);
  const propertyEntries = Object.entries(properties);
  const requiredRoot: string[] = Array.isArray(schema.required) ? schema.required : [];

  if (propertyEntries.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        No properties defined
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {propertyEntries.map(([propName, propSchema]: [string, any]) => (
        <SchemaNode
          key={propName}
          name={propName}
          schema={propSchema}
          required={requiredRoot.includes(propName)}
          depth={0}
        />
      ))}
    </Box>
  );
}
