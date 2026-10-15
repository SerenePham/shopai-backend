import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Bước 1: tra User trong DB bằng email, so khớp mật khẩu đã hash
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    // bcrypt.compare tự hash lại "password" vừa gõ rồi so với chuỗi hash lưu sẵn — KHÔNG BAO GIỜ so sánh chuỗi thường
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  // Bước 2: nếu đúng, ký một JWT chứa "sub" (subject = userId) và email
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      // Cố tình dùng CHUNG một thông báo cho cả 2 trường hợp "sai email" và "sai mật khẩu"
      // -> tránh lộ cho hacker biết email nào đã tồn tại trong hệ thống (User Enumeration)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload), // Ký bằng JWT_SECRET đã đăng ký ở AuthModule
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Email đã được đăng ký');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name ?? null,
      },
    });

    // Đăng ký xong → đăng nhập luôn (cùng contract { accessToken, user } như login)
    return this.login({ email: dto.email, password: dto.password });
  }
}
