import { Module } from '@nestjs/common';
import { AgentFeedbackReviewService } from './agent-feedback-review.service.js';
import { AgentFeedbackController } from './agent-feedback.controller.js';
import { AgentIssuesController } from './agent-issues.controller.js';
import { AgentIssuesService } from './agent-issues.service.js';
import { AgentLearningsController } from './agent-learnings.controller.js';
import { AgentLearningsService } from './agent-learnings.service.js';

@Module({
  controllers: [
    AgentIssuesController,
    AgentLearningsController,
    AgentFeedbackController,
  ],
  providers: [
    AgentIssuesService,
    AgentLearningsService,
    AgentFeedbackReviewService,
  ],
  exports: [AgentIssuesService, AgentLearningsService],
})
export class DevelopmentModule {}
