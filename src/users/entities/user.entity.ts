import { Entity, Column, Index, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AbstractEntity } from '../../shared/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  TENANT_OWNER = 'tenant_owner',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  BRANCH_MANAGER = 'branch_manager',
  INVENTORY_CLERK = 'inventory_clerk',
}

@Entity('users')
export class User extends AbstractEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'warehouse_id', type: 'uuid', nullable: true })
  warehouseId!: string | null;

  @ManyToOne(() => Warehouse, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  username!: string;

  /**
   * Password is excluded from SELECT by default.
   * Use createQueryBuilder().addSelect('user.password') when it is needed (auth flows only).
   */
  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.INVENTORY_CLERK })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /**
   * Hashes the password before any INSERT or UPDATE.
   * Because `password` has `select: false`, partial updates that do not
   * touch the password field will not have the property set, so no
   * re-hashing will occur.
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async comparePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
  }
}
