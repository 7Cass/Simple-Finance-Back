import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
    sub: string;
    email: string;
}

// Custom extractor to get JWT from both cookie and Authorization header
const extractJwtFromCookieOrHeader = (request: Request) => {
  // First try to get from Authorization header
  const tokenFromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
  if (tokenFromHeader) {
    return tokenFromHeader;
  }

  // Then try to get from cookie
  if (request && request.cookies) {
    return request.cookies['auth_token'] || request.cookies['auth_token']?.value;
  }

  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: extractJwtFromCookieOrHeader,
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload.sub) {
            throw new UnauthorizedException('Invalid token payload');
        }
        return { id: payload.sub, email: payload.email };
    }
}
