import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Tenant } from '../tenants/entities/tenant.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async signIn(usernameOrEmail: string, password: string): Promise<any> {
    let user = await this.usersService.findByEmailForAuth(usernameOrEmail);
    user ??= await this.usersService.findByUsernameForAuth(usernameOrEmail);

    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signup(createUserDto: CreateUserDto): Promise<any> {
    // 1. Create a tenant for the new client
    const tenantName = createUserDto.companyName?.trim() || `${createUserDto.username}'s Business`;
    
    // Create random unique company code based on name or timestamp
    const companyCode = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10) + '-' + Math.floor(1000 + Math.random() * 9000);
    
    const tenant = this.tenantRepository.create({
      name: tenantName,
      companyCode,
    });
    const savedTenant = await this.tenantRepository.save(tenant);

    // 2. Ensure user is created as TENANT_OWNER
    createUserDto.role = UserRole.TENANT_OWNER;

    // 3. Create user under the new tenant
    const user = await this.usersService.create(createUserDto, savedTenant.id);

    const payload = { sub: user.id, username: user.username };
    return {
      user,
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
