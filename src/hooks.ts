import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useMemo } from 'react';

export function makeKubeObject(
  json: any,
  kind: string,
  plural: string,
  apiVersion: string,
  isNamespaced: boolean
): any {
  class Dynamic extends KubeObject {
    static kind = kind;
    static apiName = plural;
    static apiVersion = apiVersion;
    static isNamespaced = isNamespaced;
  }
  return new Dynamic(json);
}

export function useDynamicKubeList(
  group: string | undefined,
  version: string | undefined,
  plural: string | undefined,
  isNamespaced: boolean,
  opts?: { kind?: string; namespace?: string }
): [any[] | null, any] {
  const kind = opts?.kind ?? plural;
  const namespace = opts?.namespace;

  const DynamicClass = useMemo(() => {
    class Dynamic extends KubeObject {
      static kind = kind;
      static apiName = plural;
      static apiVersion = `${group}/${version}`;
      static isNamespaced = isNamespaced;
    }
    return Dynamic;
  }, [group, version, plural, kind, isNamespaced]);

  return DynamicClass.useList(namespace ? { namespace } : undefined);
}
