import { Module } from '@nestjs/common';
import { AgentIssuesController } from './agent-issues.controller.js';
import { AgentIssuesService } from './agent-issues.service.js';

@Module({
  controllers: [AgentIssuesController],
  providers: [AgentIssuesService],
  exports: [AgentIssuesService],
})
export class DevelopmentModule {}
