import paper from 'paper';

export type PaperScope = paper.PaperScope;
export type PathItem = paper.PathItem;
export type Path = paper.Path;
export type Item = paper.Item;
export type CompoundPath = paper.CompoundPath;

let scopeInstance: paper.PaperScope | null = null;

export function getPaperScope(): paper.PaperScope {
  if (scopeInstance && scopeInstance.project) {
    return scopeInstance;
  }
  scopeInstance = new paper.PaperScope();
  scopeInstance.setup(new paper.Size(1000, 1000));
  return scopeInstance;
}

export function pathItemToSvgData(item: paper.PathItem): string {
  if (!item || item.isEmpty()) return '';
  const d = item.pathData;
  return d || '';
}

export function extractSubPaths(item: paper.Item): paper.Path[] {
  if (!item) return [];
  if (item instanceof paper.CompoundPath) {
    return (item.children as paper.Path[]).filter(
      (c) => c instanceof paper.Path && !c.isEmpty() && Math.abs(c.area) > 1
    );
  }
  if (item instanceof paper.Path) {
    return Math.abs(item.area) > 1 ? [item] : [];
  }
  return [];
}
