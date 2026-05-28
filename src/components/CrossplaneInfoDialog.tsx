import { Icon } from '@iconify/react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

function Node({
  cx, cy, lines, color, w = 120, h = 44,
}: {
  cx: number; cy: number; lines: string[]; color: string; w?: number; h?: number;
}) {
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={6} fill={color} />
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={lines.length === 1 ? cy + 5 : cy + (i === 0 ? -4 : 12)}
          textAnchor="middle"
          fontSize={12}
          fontWeight="600"
          fill="#fff"
          fontFamily="sans-serif"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function Edge({
  x1, y1, x2, y2, label, lx, ly, color,
}: {
  x1: number; y1: number; x2: number; y2: number;
  label?: string; lx?: number; ly?: number; color: string;
}) {
  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={1.5}
        markerEnd="url(#cp-arrow)"
      />
      {label && (
        <text
          x={lx ?? (x1 + x2) / 2}
          y={ly ?? (y1 + y2) / 2}
          textAnchor="middle"
          fontSize={10}
          fill={color}
          fontFamily="sans-serif"
          fontStyle="italic"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function RelationshipDiagram() {
  const theme = useTheme();
  const edgeColor = theme.palette.text.secondary;

  return (
    <svg viewBox="0 0 560 420" style={{ width: '100%' }}>
      <defs>
        <marker id="cp-arrow" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={edgeColor} />
        </marker>
      </defs>

      {/* Edges drawn first so nodes sit on top */}
      <Edge x1={265} y1={72} x2={240} y2={168} color={edgeColor}
        label="implemented by" lx={230} ly={116} />
      <Edge x1={300} y1={72} x2={420} y2={168} color={edgeColor}
        label="defines" lx={382} ly={113} />
      <Edge x1={130} y1={190} x2={180} y2={190} color={edgeColor}
        label="used by" lx={155} ly={182} />
      <Edge x1={248} y1={212} x2={262} y2={278} color={edgeColor}
        label="fulfills" lx={238} ly={248} />
      <Edge x1={432} y1={212} x2={310} y2={278} color={edgeColor}
        label="creates" lx={388} ly={250} />
      <Edge x1={280} y1={322} x2={280} y2={358} color={edgeColor}
        label="creates" lx={294} ly={342} />

      {/* Nodes */}
      <Node cx={280} cy={50}  lines={['XRD']}                    color="#7c3aed" />
      <Node cx={70}  cy={190} lines={['Function']}               color="#d97706" />
      <Node cx={240} cy={190} lines={['Composition']}            color="#059669" />
      <Node cx={450} cy={190} lines={['Claim']}                  color="#0891b2" />
      <Node cx={280} cy={300} lines={['Composite', 'Resource']}  color="#065f46" />
      <Node cx={280} cy={380} lines={['Managed', 'Resource']}    color="#4b5563" />
    </svg>
  );
}

export function CrossplaneInfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton onClick={() => setOpen(true)} size="small" title="About Crossplane concepts">
        <Icon icon="mdi:information-outline" width={20} />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crossplane Concepts</DialogTitle>
        <DialogContent>
          <RelationshipDiagram />
          <Box mt={2} p={1.5} sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Provider</strong> — installs Managed Resource CRDs (e.g. AWS, GCP resource types)
              <br />
              <strong>Configuration</strong> — installs XRDs, Compositions, and Functions
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
