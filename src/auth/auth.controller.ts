import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-dto';
import { Public } from './public.decorator';
import { successResponse } from '../utils/response.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const data = await this.authService.signup(createUserDto);
    return successResponse(data);
  }

  @Public()
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    const { emailOrUsername, password } = loginUserDto;
    const data = await this.authService.signIn(emailOrUsername, password);
    return successResponse(data);
  }
}