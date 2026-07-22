import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserMapper } from './mappers/user.mapper';
import { User } from './entities/user.entity';

/**
 * Module wrapping User domain logic.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UserMapper],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
