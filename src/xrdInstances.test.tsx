import { act, render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test } from 'vitest';
import { KubeObject } from './__mocks__/headlamp-k8s-cluster';
import { mockedHook, mockListsByPlural } from './testing';
import { InstanceList, instanceSpec, InstanceType, useXRDInstanceLists } from './xrdInstances';

function makeXRD(name: string, plural: string, claimPlural?: string) {
  return {
    metadata: { name },
    jsonData: {
      spec: {
        group: 'example.io',
        names: { kind: plural, plural },
        ...(claimPlural ? { claimNames: { kind: claimPlural, plural: claimPlural } } : {}),
        versions: [{ name: 'v1alpha1', referenceable: true }],
      },
    },
  };
}

const item = (name: string, ready = 'True') => ({
  metadata: { name },
  status: { conditions: [{ type: 'Ready', status: ready }] },
});

let latest: InstanceList[] | null = null;

function Harness({ xrds, type }: { xrds: any[] | null; type: InstanceType }) {
  const { watchers, lists } = useXRDInstanceLists(xrds, type);
  latest = lists;
  return <>{watchers}</>;
}

describe('instanceSpec', () => {
  test('uses the referenceable version and the composite names', () => {
    expect(instanceSpec(makeXRD('a', 'xdbs'), 'composite')).toMatchObject({
      key: 'a/composite',
      group: 'example.io',
      version: 'v1alpha1',
      plural: 'xdbs',
    });
  });

  test('returns null for the claim type of an XRD without claimNames', () => {
    expect(instanceSpec(makeXRD('a', 'xdbs'), 'claim')).toBeNull();
  });
});

describe('useXRDInstanceLists', () => {
  beforeEach(() => {
    latest = null;
  });

  test('stays null while XRDs are loading', () => {
    mockListsByPlural(KubeObject.useList, {});
    render(<Harness xrds={null} type="composite" />);
    expect(latest).toBeNull();
  });

  test('stays null until every watched list has reported', () => {
    mockedHook(KubeObject.useList).mockReturnValue([null, null]);
    render(<Harness xrds={[makeXRD('a', 'xdbs')]} type="composite" />);
    expect(latest).toBeNull();
  });

  test('returns each XRD instance list as raw JSON', () => {
    mockListsByPlural(KubeObject.useList, { xdbs: [item('db1')], xcaches: [item('c1'), item('c2')] });
    render(<Harness xrds={[makeXRD('a', 'xdbs'), makeXRD('b', 'xcaches')]} type="composite" />);
    expect(latest?.map(l => [l.plural, l.items.map(i => i.metadata.name)])).toEqual([
      ['xdbs', ['db1']],
      ['xcaches', ['c1', 'c2']],
    ]);
  });

  test('only watches claim types for XRDs that define one', () => {
    mockListsByPlural(KubeObject.useList, { databases: [item('claim1')] });
    render(<Harness xrds={[makeXRD('a', 'xdbs', 'databases'), makeXRD('b', 'xcaches')]} type="claim" />);
    expect(latest).toHaveLength(1);
    expect(latest?.[0].items[0].metadata.name).toBe('claim1');
  });

  test('treats a list that errors as empty', () => {
    mockedHook(KubeObject.useList).mockReturnValue([null, { message: 'forbidden' }]);
    render(<Harness xrds={[makeXRD('a', 'xdbs')]} type="composite" />);
    expect(latest?.[0].items).toEqual([]);
  });

  test('reflects watch updates without refetching', () => {
    mockListsByPlural(KubeObject.useList, { xdbs: [item('db1', 'False')] });
    const xrds = [makeXRD('a', 'xdbs')];
    const { rerender } = render(<Harness xrds={xrds} type="composite" />);
    expect(latest?.[0].items[0].status.conditions[0].status).toBe('False');

    mockListsByPlural(KubeObject.useList, { xdbs: [item('db1', 'True')] });
    act(() => rerender(<Harness xrds={xrds} type="composite" />));
    expect(latest?.[0].items[0].status.conditions[0].status).toBe('True');
  });
});
