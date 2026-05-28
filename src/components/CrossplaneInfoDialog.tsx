import { Icon } from '@iconify/react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
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

function Arrow({
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
  const edge = theme.palette.text.secondary;
  const laneBg = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const laneText = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  const tabText = theme.palette.mode === 'dark' ? '#aaa' : '#777';

  // vertical centres for each swim lane
  const PY = 88;   // platform nodes
  const IY = 278;  // instance nodes
  const PB = PY + 22; // platform node bottom edge
  const IT = IY - 22; // instance node top edge
  const mid = (PB + IT) / 2;

  return (
    <svg viewBox="0 0 740 360" style={{ width: '100%' }}>
      <defs>
        <marker id="cp-arrow" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={edge} />
        </marker>
      </defs>

      {/* Swim lane backgrounds */}
      <rect x={8} y={14} width={724} height={112} rx={8} fill={laneBg} />
      <rect x={8} y={192} width={724} height={120} rx={8} fill={laneBg} />

      {/* Lane labels */}
      <text x={20} y={32} fontSize={9} letterSpacing={1.5} fill={laneText} fontFamily="sans-serif" fontWeight="700">PLATFORM SETUP</text>
      <text x={20} y={210} fontSize={9} letterSpacing={1.5} fill={laneText} fontFamily="sans-serif" fontWeight="700">RUNTIME INSTANCES</text>

      {/* ── Platform horizontal arrows ─────────────────────── */}
      {/* XRD → Composition */}
      <Arrow x1={180} y1={PY} x2={240} y2={PY} color={edge} label="defines" lx={210} ly={PY - 10} />
      {/* Composition → Function */}
      <Arrow x1={360} y1={PY} x2={410} y2={PY} color={edge} label="uses" lx={385} ly={PY - 10} />

      {/* ── Cross-lane arrows (platform → instances) ─────── */}
      {/* XRD → Claim: defines claim type */}
      <Arrow x1={115} y1={PB} x2={100} y2={IT} color={edge} label="defines claim type" lx={62} ly={mid} />
      {/* Composition → Composite Resource: implements XR */}
      <Arrow x1={305} y1={PB} x2={352} y2={IT} color={edge} label="implements" lx={297} ly={mid} />
      {/* Provider → Managed Resource: provides MR types */}
      <Arrow x1={632} y1={PB} x2={618} y2={IT} color={edge} label="provides MR types" lx={675} ly={mid} />

      {/* ── Instance horizontal arrows ─────────────────────── */}
      {/* Claim → Composite Resource */}
      <Arrow x1={162} y1={IY} x2={292} y2={IY} color={edge} label="creates" lx={227} ly={IY - 10} />
      {/* Composite Resource → Managed Resource */}
      <Arrow x1={428} y1={IY} x2={546} y2={IY} color={edge} label="creates" lx={487} ly={IY - 10} />

      {/* ── Platform nodes ─────────────────────────────────── */}
      <Node cx={120} cy={PY} lines={['XRD']}         color="#7c3aed" />
      <Node cx={300} cy={PY} lines={['Composition']} color="#059669" />
      <Node cx={470} cy={PY} lines={['Function']}    color="#d97706" />
      <Node cx={642} cy={PY} lines={['Provider']}    color="#c2410c" />

      {/* ── Instance nodes ─────────────────────────────────── */}
      <Node cx={100}  cy={IY} lines={['Claim']}                   color="#0891b2" />
      <Node cx={360}  cy={IY} lines={['Composite', 'Resource']}   color="#065f46" w={130} />
      <Node cx={612}  cy={IY} lines={['Managed', 'Resource']}     color="#374151" w={130} />

      {/* ── Tab labels ─────────────────────────────────────── */}
      <text x={120} y={132} textAnchor="middle" fontSize={10} fill={tabText} fontFamily="sans-serif" fontStyle="italic">XRDs</text>
      <text x={300} y={132} textAnchor="middle" fontSize={10} fill={tabText} fontFamily="sans-serif" fontStyle="italic">Compositions</text>
      <text x={470} y={132} textAnchor="middle" fontSize={10} fill={tabText} fontFamily="sans-serif" fontStyle="italic">Functions</text>
      <text x={642} y={132} textAnchor="middle" fontSize={10} fill={tabText} fontFamily="sans-serif" fontStyle="italic">Providers</text>

      <text x={100} y={322} textAnchor="middle" fontSize={10} fill={tabText} fontFamily="sans-serif" fontStyle="italic">Claims</text>
      <text x={360} y={322} textAnchor="middle" fontSize={10} fill={tabText} fontFamily="sans-serif" fontStyle="italic">Composite Resources</text>
      <text x={612} y={322} textAnchor="middle" fontSize={10} fill={tabText} fontFamily="sans-serif" fontStyle="italic">Managed Resources</text>
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crossplane Concepts</DialogTitle>
        <DialogContent>
          <RelationshipDiagram />

          <Divider sx={{ my: 1.5 }} />

          <Box display="flex" gap={3}>
            <Box flex={1}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={1}>
                TROUBLESHOOTING
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Start at <strong>Claims</strong> to find a failing user request, follow it to <strong>Composite Resources</strong> to see what was composed, then <strong>Managed Resources</strong> to inspect the actual infrastructure.
              </Typography>
            </Box>
            <Box flex={1}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={1}>
                PLATFORM SETUP
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                <strong>Providers</strong> and <strong>Configurations</strong> install the building blocks. <strong>XRDs</strong> define the API shape. <strong>Compositions</strong> implement the logic, using <strong>Functions</strong> as pipeline steps.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
