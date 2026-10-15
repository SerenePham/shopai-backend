import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // POST /api/auth/login
  @HttpCode(HttpStatus.OK) // Mặc định NestJS trả 201 cho POST, ta ép về 200 vì đây là "đăng nhập" chứ không "tạo mới"
  @ApiOperation({ summary: 'Đăng nhập bằng email + mật khẩu, trả về accessToken JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register') // POST /api/auth/register — nối RegisterScreen (Ch.5/6)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới (hash bcrypt), trả accessToken như login' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
