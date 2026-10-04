import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useDynamicKubeList } from './hooks';
import { getReferenceableVersion } from './utils';

export type InstanceType = 'composite' | 'claim';

export interface InstanceSpec {
  key: string;
  xrd: any;
  group: string;
  version: string;
  plural: string;
  kind: string;
}

export interface InstanceList extends InstanceSpec {
  // Raw JSON objects (not KubeObject wrappers).
  items: any[];
}

export function instanceSpec(xrd: any, type: InstanceType): InstanceSpec | null {
  const spec = xrd.jsonData?.spec;
  const names = type === 'claim' ? spec?.claimNames : spec?.names;
  if (!spec?.group || !names?.plural) return null;
  return {
    key: `${xrd.metadata.name}/${type}`,
    xrd,
    group: spec.group,
    version: getReferenceableVersion(spec),
    plural: names.plural,
    kind: names.kind,
  };
}

function InstanceWatcher({
  spec,
  onUpdate,
}: {
  spec: InstanceSpec;
  onUpdate: (key: string, items: any[]) => void;
}) {
  // Listed through a cluster-scoped class so one watch covers every namespace.
  const [items, error] = useDynamicKubeList(spec.group, spec.version, spec.plural, false, {
    kind: spec.kind,
  });
  useEffect(() => {
    if (items) onUpdate(spec.key, items.map((i: any) => i.jsonData));
    else if (error) onUpdate(spec.key, []);
  }, [items, error, spec.key, onUpdate]);
  return null;
}

// Live instances of every XRD's composite or claim type. The number of XRDs
// varies, so each list is watched by its own child component; callers must
// render `watchers`. `lists` stays null until every list has reported.
export function useXRDInstanceLists(
  xrds: any[] | null,
  type: InstanceType
): { watchers: ReactNode; lists: InstanceList[] | null } {
  const specs = useMemo(
    () =>
      (xrds ?? [])
        .map(xrd => instanceSpec(xrd, type))
        .filter((s): s is InstanceSpec => s !== null),
    [xrds, type]
  );

  const [byKey, setByKey] = useState<Record<string, any[]>>({});
  const onUpdate = useCallback(
    (key: string, items: any[]) => setByKey(prev => ({ ...prev, [key]: items })),
    []
  );

  const lists = useMemo(
    () =>
      xrds === null || specs.some(s => byKey[s.key] === undefined)
        ? null
        : specs.map(s => ({ ...s, items: byKey[s.key] })),
    [xrds, specs, byKey]
  );

  const watchers = (
    <>
      {specs.map(s => (
        <InstanceWatcher key={s.key} spec={s} onUpdate={onUpdate} />
      ))}
    </>
  );

  return { watchers, lists };
}
