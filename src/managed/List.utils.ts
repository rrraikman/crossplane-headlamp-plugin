export interface MRType {
  kind: string;
  group: string;
  version: string;
  plural: string;
}

export function crdToMRType(crd: any): MRType {
  const storageVersion =
    crd.spec.versions?.find((v: any) => v.storage) ?? crd.spec.versions?.[0];
  return {
    kind: crd.spec.names.kind,
    group: crd.spec.group,
    version: storageVersion?.name ?? 'v1',
    plural: crd.spec.names.plural,
  };
}

export function typeKey(t: MRType): string {
  return `${t.group}/${t.plural}`;
}
