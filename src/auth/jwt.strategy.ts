import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Đọc đúng định dạng Header "Authorization: Bearer <token>" mà axiosClient (Chương 6) đang tự gắn
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Token hết hạn (JWT_EXPIRES_IN) phải bị từ chối, không được du di
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'defaultSecret', // Cùng bí mật đã dùng để ký ở AuthService
    });
  }

  // Passport TỰ ĐỘNG gọi hàm này SAU KHI xác minh chữ ký hợp lệ và Token chưa hết hạn.
  // Giá trị return ở đây sẽ được Nest gắn thẳng vào `request.user` cho MỌI Controller phía sau Guard.
  async validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
