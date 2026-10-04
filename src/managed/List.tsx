import {
  Link as HeadlampLink,
  Loader,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, CircularProgress, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import {
  countInstances,
  crdToMRType,
  fetchManagedResourceCRDs,
  mapWithConcurrency,
  MRType,
  typeKey,
} from './List.utils';

export function ManagedResourceBrowser() {
  const [types, setTypes] = useState<MRType[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [hideEmpty, setHideEmpty] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchManagedResourceCRDs()
      .then(items => {
        if (cancelled) return;
        const result = items.map(crdToMRType);
        result.sort((a, b) => a.group.localeCompare(b.group) || a.kind.localeCompare(b.kind));
        setTypes(result);
        setCounts(Object.fromEntries(result.map(t => [typeKey(t), null])));

        mapWithConcurrency(result, 8, async t => {
          if (cancelled) return;
          const count = await countInstances(t).catch(() => 0);
          if (!cancelled) setCounts(prev => ({ ...prev, [typeKey(t)]: count }));
        });
      })
      .catch(err => {
        if (cancelled) return;
        setLoadError(err?.message ?? 'Failed to load CRDs');
        setTypes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allCountsResolved = useMemo(
    () => types !== null && types.length > 0 && types.every(t => counts[typeKey(t)] !== null),
    [types, counts]
  );

  const hiddenCount = useMemo(
    () => (allCountsResolved ? Object.values(counts).filter(c => c === 0).length : 0),
    [allCountsResolved, counts]
  );

  const filtered = useMemo(() => {
    if (!types) return null;
    let result = types;

    // Apply hideEmpty and count-based sort only once all counts are resolved.
    // This prevents the table from shrinking incrementally as counts come in.
    if (allCountsResolved) {
      if (hideEmpty) {
        result = result.filter(r => (counts[typeKey(r)] ?? 0) > 0);
      }
      result = [...result].sort((a, b) => {
        const ca = counts[typeKey(a)] ?? 0;
        const cb = counts[typeKey(b)] ?? 0;
        if (cb !== ca) return cb - ca;
        return a.group.localeCompare(b.group) || a.kind.localeCompare(b.kind);
      });
    }

    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter(
        r => r.kind.toLowerCase().includes(q) || r.group.toLowerCase().includes(q)
      );
    }

    return result;
  }, [types, filter, hideEmpty, counts, allCountsResolved]);

  if (!types) return <Loader title="Loading managed resource types..." />;

  return (
    <SectionBox title="Managed Resources">
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}
      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Filter by kind or group…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          sx={{ width: 320 }}
        />
        <FormControlLabel
          control={
            <Switch size="small" checked={hideEmpty} onChange={e => setHideEmpty(e.target.checked)} />
          }
          label={
            <Typography variant="body2">
              {hideEmpty && hiddenCount > 0 ? `Hide empty (${hiddenCount} hidden)` : 'Hide empty'}
            </Typography>
          }
        />
        {!allCountsResolved && types.length > 0 && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <CircularProgress size={14} />
            <Typography variant="caption" color="text.secondary">
              Loading counts…
            </Typography>
          </Box>
        )}
      </Box>
      <SimpleTable
        columns={[
          {
            label: 'Kind',
            getter: (r: MRType) => (
              <HeadlampLink
                routeName="crossplane-managed-type"
                params={{ group: r.group, version: r.version, plural: r.plural, kind: r.kind }}
              >
                {r.kind}
              </HeadlampLink>
            ),
          },
          { label: 'Group', getter: (r: MRType) => r.group },
          { label: 'Version', getter: (r: MRType) => r.version },
          {
            label: 'Instances',
            getter: (r: MRType) => {
              const c = counts[typeKey(r)];
              return c === null ? '…' : String(c);
            },
          },
        ]}
        data={filtered}
        emptyMessage={
          hideEmpty && !filter
            ? 'No managed resource types with instances found'
            : 'No managed resource types found'
        }
      />
    </SectionBox>
  );
}
