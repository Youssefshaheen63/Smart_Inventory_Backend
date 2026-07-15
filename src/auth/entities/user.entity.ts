import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('users')
export class User extends AbstractEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'enum', enum: ['manager', 'staff'], default: 'staff' })
  role!: string;
}
