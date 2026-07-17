import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserMapper } from './mappers/user.mapper';
import { PaginationQueryDto } from '../utils/query.dto';
import { paginate } from '../utils/pagination.util';
import { applySortAndSearch } from '../utils/query.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userMapper: UserMapper,
  ) {}

  /**
   * Create a new user with unique email and username checks.
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const emailTaken = await this.userRepository.existsBy({
      email: createUserDto.email,
    });
    if (emailTaken) {
      throw new ConflictException('Email already in use');
    }

    const usernameTaken = await this.userRepository.existsBy({
      username: createUserDto.username,
    });
    if (usernameTaken) {
      throw new ConflictException('Username already in use');
    }

    const user = this.userMapper.toEntity(createUserDto);
    const saved = await this.userRepository.save(user);
    this.logger.log(`User created: ${saved.id}`);
    return this.userMapper.toResponse(saved);
  }

  /**
   * Return all active (non-deleted) users.
   */
  async findAll(query: PaginationQueryDto): Promise<{ data: UserResponseDto[]; total: number }> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });
    applySortAndSearch(qb, 'user', query.sortBy, query.sortOrder, query.search, ['username', 'email', 'firstName', 'lastName']);
    const result = await paginate(qb, query.page!, query.limit!);
    return { data: this.userMapper.toResponseList(result.data), total: result.total };
  }

  /**
   * Find a single user by UUID and return a safe response DTO.
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return this.userMapper.toResponse(user);
  }

  /**
   * Returns the raw User entity WITH the password field selected.
   * For AUTH USE ONLY — never expose this outside of the auth flow.
   */
  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  /**
   * Returns the raw User entity WITH the password field selected.
   * For AUTH USE ONLY — never expose this outside of the auth flow.
   */
  async findByUsernameForAuth(username: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  /**
   * Update a user's profile fields (email, username, firstName, lastName).
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailTaken = await this.userRepository.existsBy({ email: updateUserDto.email });
      if (emailTaken) {
        throw new ConflictException('Email already in use');
      }
      user.email = updateUserDto.email.toLowerCase().trim();
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const usernameTaken = await this.userRepository.existsBy({ username: updateUserDto.username });
      if (usernameTaken) {
        throw new ConflictException('Username already in use');
      }
      user.username = updateUserDto.username.trim();
    }

    if (updateUserDto.firstName !== undefined) {
      user.firstName = updateUserDto.firstName?.trim() ?? null;
    }
    if (updateUserDto.lastName !== undefined) {
      user.lastName = updateUserDto.lastName?.trim() ?? null;
    }

    const saved = await this.userRepository.save(user);
    this.logger.log(`User updated: ${saved.id}`);
    return this.userMapper.toResponse(saved);
  }

  /**
   * Soft-delete a user by ID (sets deletedAt; record is preserved in DB).
   */
  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    await this.userRepository.softRemove(user);
    this.logger.log(`User soft-deleted: ${id}`);
  }
}
