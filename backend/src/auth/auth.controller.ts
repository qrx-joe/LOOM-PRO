import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/guards/public.decorator';
import { AuthService } from './auth.service';

class LoginDto {
  username!: string;
  password!: string;
}

class RegisterDto {
  username!: string;
  email!: string;
  password!: string;
}

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.email, dto.password);
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  getMe(@Request() req: any) {
    return req.user;
  }
}