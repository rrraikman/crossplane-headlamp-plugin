export class KubeObject {
  jsonData: any;
  metadata: any;

  constructor(data: any = {}) {
    this.jsonData = data;
    this.metadata = data?.metadata ?? {};
  }

  static useGet(/* name */): [any, any] {
    return [null, null];
  }

  static useList(): [any[], any] {
    return [[], null];
  }
}
