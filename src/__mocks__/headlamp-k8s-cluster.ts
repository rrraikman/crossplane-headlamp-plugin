import { vi } from 'vitest';

export class KubeObject {
  jsonData: any;
  metadata: any;

  constructor(data: any = {}) {
    this.jsonData = data;
    this.metadata = data?.metadata ?? {};
  }

  static useGet = vi.fn<() => [any, any]>().mockReturnValue([null, null]);
  static useList = vi.fn<() => [any[], any]>().mockReturnValue([null, null]);
}
