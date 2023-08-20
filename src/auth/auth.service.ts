import { Injectable, ForbiddenException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { AuthDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshDto } from './dto/refresh.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  salt = parseInt(process.env.CRYPT_SALT);
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getJwtAccessToke(id: string, login: string): Promise<string> {
    const payload = { sub: id, id, login };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('auth.jwrAccess'),
      expiresIn: this.configService.get('auth.jwrAccessTime'),
    });
    return token;
  }

  public async getJwtRefreshToken(id: string, login: string): Promise<string> {
    const payload = { sub: id, id, login };
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('auth.jwrRefresh'),
      expiresIn: this.configService.get('auth.jwrRefreshTime'),
    });
    return refreshToken;
  }

  async signup(authDto: AuthDto) {
    const passwordHash = await hash(authDto.password, this.salt);

    const user = await this.prisma.user.create({
      data: {
        login: authDto.login,
        passwordHash,
      },
      select: {
        id: true,
        login: true,
        createdAt: true,
      },
    });
    return user;
  }
  async login(loginDto: AuthDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        login: loginDto.login,
      },
    });
    if (!user) throw new ForbiddenException('Credentials incorrect');
    const isCompare = await compare(loginDto.password, user.passwordHash);
    if (!isCompare) throw new ForbiddenException('Credentials incorrect');

    return {
      accessToken: await this.getJwtAccessToke(user.id, user.login),
      refreshToken: await this.getJwtRefreshToken(user.id, user.login),
    };
  }
  async refresh(refreshDto: RefreshDto) {
    const { refreshToken } = refreshDto;
    try {
      const decodedToken = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('auth.jwrRefresh'),
      });
      return {
        accessToken: await this.getJwtAccessToke(
          decodedToken.id,
          decodedToken.login,
        ),
        refreshToken: await this.getJwtRefreshToken(
          decodedToken.id,
          decodedToken.login,
        ),
      };
    } catch (error) {
      throw new ForbiddenException('Credentials incorrect');
    }
  }
}
