import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createAuth } from './auth.js';
import { AuthGuard, AUTH_INSTANCE } from './auth.guard.js';

@Global()
@Module({
  providers: [
    {
      provide: AUTH_INSTANCE,
      useFactory: createAuth,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AUTH_INSTANCE],
})
export class AuthModule {}
