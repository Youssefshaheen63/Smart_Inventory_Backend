import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserMapper } from './mappers/user.mapper';
import { User } from './entities/user.entity';

/**
 * Module wrapping User domain logic.
 * Only UsersService is exported — consumers must not depend on infrastructure details.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UserMapper],
  exports: [UsersService],
})
export class UsersModule {}
