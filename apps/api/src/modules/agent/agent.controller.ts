import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ZodType } from 'zod';
import {
  AllowFieldRoles,
  AllowLimited,
  CurrentUser,
} from '../auth/decorators.js';
import { IMAGES_MODULE_ROLES } from '../auth/field-roles.js';
import { AgentChatService } from './agent-chat.service.js';
import { AgentFeedbackService } from './agent-feedback.service.js';
import { isAgentConfigured } from './agent-model.js';
import { partitionScopes, toAgentUser } from './agent-scopes.js';
import { AgentThreadsService } from './agent-threads.service.js';
import {
  agentChatBodySchema,
  agentFeedbackBodySchema,
  messageIdSchema,
  renameThreadSchema,
  threadIdSchema,
} from './dto/agent-chat.schema.js';

@AllowLimited()
@AllowFieldRoles(...IMAGES_MODULE_ROLES)
@Controller('agent')
export class AgentController {
  constructor(
    private readonly chat: AgentChatService,
    private readonly threads: AgentThreadsService,
    private readonly feedback: AgentFeedbackService,
  ) {}

  @Post('chat')
  async streamChat(
    @CurrentUser() rawUser: Record<string, unknown>,
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.chat.stream(
      req,
      res,
      toAgentUser(rawUser),
      parse(agentChatBodySchema, body),
    );
  }

  @Get('capabilities')
  capabilities(@CurrentUser() rawUser: Record<string, unknown>) {
    const user = toAgentUser(rawUser);
    const { allowed } = partitionScopes(user);
    return {
      data: {
        enabled: isAgentConfigured(),
        role: user.role,
        scopes: allowed.map((s) => ({ key: s.key, label: s.label })),
      },
    };
  }

  @Get('threads')
  async listThreads(@CurrentUser() rawUser: Record<string, unknown>) {
    const data = await this.threads.list(toAgentUser(rawUser).id);
    return { data };
  }

  @Get('threads/:id')
  async getThread(
    @CurrentUser() rawUser: Record<string, unknown>,
    @Param('id') id: string,
  ) {
    const data = await this.threads.get(
      toAgentUser(rawUser).id,
      parse(threadIdSchema, id),
    );
    return { data };
  }

  @Patch('threads/:id')
  async renameThread(
    @CurrentUser() rawUser: Record<string, unknown>,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const { title } = parse(renameThreadSchema, body);
    await this.threads.rename(
      toAgentUser(rawUser).id,
      parse(threadIdSchema, id),
      title,
    );
    return { data: { ok: true } };
  }

  @Delete('threads/:id')
  @HttpCode(200)
  async deleteThread(
    @CurrentUser() rawUser: Record<string, unknown>,
    @Param('id') id: string,
  ) {
    await this.threads.remove(
      toAgentUser(rawUser).id,
      parse(threadIdSchema, id),
    );
    return { data: { ok: true } };
  }

  @Get('threads/:id/feedback')
  async listFeedback(
    @CurrentUser() rawUser: Record<string, unknown>,
    @Param('id') id: string,
  ) {
    const data = await this.feedback.forThread(
      toAgentUser(rawUser).id,
      parse(threadIdSchema, id),
    );
    return { data };
  }

  @Put('threads/:id/messages/:messageId/feedback')
  async rateMessage(
    @CurrentUser() rawUser: Record<string, unknown>,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() body: unknown,
  ) {
    const data = await this.feedback.rate(
      toAgentUser(rawUser).id,
      parse(threadIdSchema, id),
      parse(messageIdSchema, messageId),
      parse(agentFeedbackBodySchema, body),
    );
    return { data };
  }

  @Delete('threads/:id/messages/:messageId/feedback')
  @HttpCode(200)
  async clearRating(
    @CurrentUser() rawUser: Record<string, unknown>,
    @Param('messageId') messageId: string,
  ) {
    await this.feedback.clear(
      toAgentUser(rawUser).id,
      parse(messageIdSchema, messageId),
    );
    return { data: { ok: true } };
  }
}

function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException(
      result.error.issues.map((issue) => issue.message).join('. '),
    );
  }
  return result.data;
}
