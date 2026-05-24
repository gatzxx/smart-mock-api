export class EntityStore {
  private readonly collections = new Map<
    string,
    Map<string, Record<string, unknown>>
  >();
  private readonly initializedEntities = new Set<string>();

  private getCollection(entity: string): Map<string, Record<string, unknown>> {
    const existingCollection = this.collections.get(entity);

    if (existingCollection) {
      return existingCollection;
    }

    const collection = new Map<string, Record<string, unknown>>();
    this.collections.set(entity, collection);
    return collection;
  }

  has(entity: string): boolean {
    return this.getCollection(entity).size > 0;
  }

  isInitialized(entity: string): boolean {
    return this.initializedEntities.has(entity);
  }

  private markInitialized(entity: string): void {
    this.initializedEntities.add(entity);
  }

  list(entity: string): Record<string, unknown>[] {
    return Array.from(this.getCollection(entity).values());
  }

  get(entity: string, id: string): Record<string, unknown> | undefined {
    return this.getCollection(entity).get(id);
  }

  seed(entity: string, idField: string, items: Record<string, unknown>[]): void {
    const collection = this.getCollection(entity);

    for (const item of items) {
      const id = String(item[idField]);
      collection.set(id, { ...item, [idField]: id });
    }

    this.markInitialized(entity);
  }

  create(
    entity: string,
    idField: string,
    item: Record<string, unknown>,
  ): Record<string, unknown> {
    const id = String(item[idField]);
    const record = { ...item, [idField]: id };
    this.getCollection(entity).set(id, record);
    this.markInitialized(entity);
    return record;
  }

  update(
    entity: string,
    id: string,
    patch: Record<string, unknown>,
    idField: string,
  ): Record<string, unknown> | undefined {
    const existingItem = this.get(entity, id);

    if (!existingItem) {
      return undefined;
    }

    const updatedItem = { ...existingItem, ...patch, [idField]: id };
    this.getCollection(entity).set(id, updatedItem);
    return updatedItem;
  }

  delete(entity: string, id: string): boolean {
    return this.getCollection(entity).delete(id);
  }
}
