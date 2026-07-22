import { Entity, Column, Index, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AbstractEntity } from '../../shared/base.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  username!: string;

  /**
   * Password hash is excluded from SELECT by default.
   * Use createQueryBuilder().addSelect('user.passwordHash') when it is needed (auth flows only).
   */
  @Column({ type: 'varchar', length: 255, select: false, name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => Warehouse, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse | null;

  @Index('idx_users_warehouse')
  @Column({ name: 'warehouse_id', type: 'uuid', nullable: true })
  warehouseId!: string | null;

  /**
   * Hashes the password before any INSERT or UPDATE.
   * Because `passwordHash` has `select: false`, partial updates that do not
   * touch the password field will not have the property set, so no
   * re-hashing will occur.
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.passwordHash) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    }
  }

  async comparePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
  }
}
