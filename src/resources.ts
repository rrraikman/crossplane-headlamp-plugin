import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export class Provider extends KubeObject {
  static kind = 'Provider';
  static apiName = 'providers';
  static apiVersion = 'pkg.crossplane.io/v1';
  static isNamespaced = false;
}

export class Configuration extends KubeObject {
  static kind = 'Configuration';
  static apiName = 'configurations';
  static apiVersion = 'pkg.crossplane.io/v1';
  static isNamespaced = false;
}

export class CompositeResourceDefinition extends KubeObject {
  static kind = 'CompositeResourceDefinition';
  static apiName = 'compositeresourcedefinitions';
  static apiVersion = 'apiextensions.crossplane.io/v1';
  static isNamespaced = false;
}

export class Composition extends KubeObject {
  static kind = 'Composition';
  static apiName = 'compositions';
  static apiVersion = 'apiextensions.crossplane.io/v1';
  static isNamespaced = false;
}

export class ProviderRevision extends KubeObject {
  static kind = 'ProviderRevision';
  static apiName = 'providerrevisions';
  static apiVersion = 'pkg.crossplane.io/v1';
  static isNamespaced = false;
}

export class ConfigurationRevision extends KubeObject {
  static kind = 'ConfigurationRevision';
  static apiName = 'configurationrevisions';
  static apiVersion = 'pkg.crossplane.io/v1';
  static isNamespaced = false;
}
