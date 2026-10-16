import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { BriloWebapiModule } from '../brilo-webapi/brilo-webapi.module.js';
import { DevelopmentModule } from '../development/development.module.js';
import { AgentChatService } from './agent-chat.service.js';
import { AgentComposeService } from './agent-compose.service.js';
import { AgentEndpointsService } from './agent-endpoints.service.js';
import { AgentFeedbackService } from './agent-feedback.service.js';
import { AgentMemoryService } from './agent-memory.service.js';
import { AgentThreadsService } from './agent-threads.service.js';
import { AgentController } from './agent.controller.js';

@Module({
  imports: [DiscoveryModule, DevelopmentModule, BriloWebapiModule],
  controllers: [AgentController],
  providers: [
    AgentChatService,
    AgentComposeService,
    AgentThreadsService,
    AgentEndpointsService,
    AgentFeedbackService,
    AgentMemoryService,
  ],
})
export class AgentModule {}
