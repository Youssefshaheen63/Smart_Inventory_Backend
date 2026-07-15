import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { User } from "../entities/user.entity";

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ where: { username } });
  }

  /**
   * Find active user by email
   */
  async findActiveByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: { email, isActive: true },
    });
  }

  /**
   * Find active user by username
   */
  async findActiveByUsername(username: string): Promise<User | null> {
    return this.findOne({
      where: { username, isActive: true },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.findOne({ where: { id } });
  }

  /**
   * Create new user
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.create(userData);
    return this.save(user);
  }

  /**
   * Update user
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    await this.update(id, userData);
    return this.findById(id);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    const result = await this.delete(id);
    return true;
  }

  /**
   * Get all active users
   */
  async findAllActive(): Promise<User[]> {
    return this.find({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.count({ where: { email } });
    return count > 0;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const count = await this.count({ where: { username } });
    return count > 0;
  }
}
