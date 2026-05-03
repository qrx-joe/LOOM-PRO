import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, email: string, password: string) {
    const exist = await this.userRepo.findOne({
      where: [{ username }, { email }],
    });
    if (exist) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, email, password: hashed });
    await this.userRepo.save(user);

    return this.generateToken(user);
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return this.generateToken(user);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, username: user.username, roles: user.roles };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }
}