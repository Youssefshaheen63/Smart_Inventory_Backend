import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { UserRepository } from "./repositories/user.repository";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    if (await this.userRepository.emailExists(createUserDto.email)) {
      throw new ConflictException("Email already exists");
    }

    // Check if username already exists
    if (await this.userRepository.usernameExists(createUserDto.username)) {
      throw new ConflictException("Username already exists");
    }

    const user = await this.userRepository.createUser({
      ...createUserDto,
      role: "user",
    });

    this.logger.log(`User created: ${user.id}`);
    return this.toResponseDto(user);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.toResponseDto(user);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Find active user by email
   */
  async findActiveByEmail(email: string): Promise<User | null> {
    return this.userRepository.findActiveByEmail(email);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  /**
   * Find active user by username
   */
  async findActiveByUsername(username: string): Promise<User | null> {
    return this.userRepository.findActiveByUsername(username);
  }

  /**
   * Get all active users
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAllActive();
    return users.map((user) => this.toResponseDto(user));
  }

  /**
   * Delete user
   */
  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const deleted = await this.userRepository.deleteUser(id);
    if (deleted) {
      this.logger.log(`User deleted: ${id}`);
    }
  }

  /**
   * Convert User entity to response DTO (removes password)
   */
  private toResponseDto(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
