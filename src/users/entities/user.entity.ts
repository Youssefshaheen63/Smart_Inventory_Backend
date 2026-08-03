import { Entity, Column, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AbstractEntity } from '../../shared/base.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User extends AbstractEntity {
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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
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
