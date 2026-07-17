import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export function applySortAndSearch<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  alias: string,
  sortBy: string = 'createdAt',
  sortOrder: 'ASC' | 'DESC' = 'DESC',
  search?: string,
  searchColumns?: string[],
): SelectQueryBuilder<T> {
  queryBuilder.orderBy(`${alias}.${sortBy}`, sortOrder);

  if (search && searchColumns && searchColumns.length > 0) {
    const conditions = searchColumns.map(
      (col) => `${alias}."${col}" ILIKE :search`,
    );
    queryBuilder.andWhere(`(${conditions.join(' OR ')})`, {
      search: `%${search}%`,
    });
  }

  return queryBuilder;
}
