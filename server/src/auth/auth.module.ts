import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy'; // Import the new strategy
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule, // Make sure ConfigModule is imported
    JwtModule.register({
      secret: 'YOUR_SECRET_KEY', // IMPORTANT: Use an env variable in production
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy], // <-- ADD GoogleStrategy HERE
  controllers: [AuthController],
})
export class AuthModule {}
