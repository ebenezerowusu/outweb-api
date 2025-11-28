import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { EmailsService } from "./emails.service";
import { SendEmailDto } from "./dto/send-email.dto";
import { SendBatchEmailDto } from "./dto/send-batch-email.dto";
import { EmailTemplateType } from "./interfaces/email-template.interface";

/**
 * Emails Controller
 * Handles email sending via templates
 */
@ApiTags("Emails")
@Controller("emails")
@ApiBearerAuth("Authorization")
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  /**
   * Send email to single or multiple recipients (same variables)
   */
  @Post("send")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Send email to single or multiple recipients (same content)",
    description: `
      Use this endpoint when sending the SAME email with SAME variables to one or more recipients.

      Examples:
      - Send welcome email to new user
      - Send same notification to all admins
      - Broadcast announcement to dealer group
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Email(s) sent successfully",
    schema: {
      example: {
        sent: 3,
        failed: 0,
        message: "Sent 3/3 emails successfully",
        templateType: "VERIFY_EMAIL",
        results: [
          { email: "user1@example.com", success: true },
          { email: "user2@example.com", success: true },
          { email: "user3@example.com", success: true },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid template or variables" })
  async sendEmail(@Body() dto: SendEmailDto) {
    const result = await this.emailsService.sendTemplateEmail(dto);
    const total = result.sent + result.failed;

    return {
      ...result,
      message: `Sent ${result.sent}/${total} emails successfully`,
      templateType: dto.templateType,
    };
  }

  /**
   * Send personalized emails to multiple recipients
   */
  @Post("send-batch")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Send personalized emails to multiple recipients",
    description: `
      Use this endpoint when each recipient needs DIFFERENT variables.

      Examples:
      - Send verification emails with unique tokens
      - Send invoices with different amounts
      - Send password reset emails with different links
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Batch emails sent",
    schema: {
      example: {
        sent: 3,
        failed: 0,
        message: "Sent 3/3 emails successfully",
        templateType: "VERIFY_EMAIL",
        results: [
          { email: "user1@example.com", success: true },
          { email: "user2@example.com", success: true },
          { email: "user3@example.com", success: true },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid template or variables" })
  async sendBatchEmail(@Body() dto: SendBatchEmailDto) {
    const result = await this.emailsService.sendPersonalizedBatch(dto);
    const total = dto.emails.length;

    return {
      ...result,
      message: `Sent ${result.sent}/${total} emails successfully`,
      templateType: dto.templateType,
    };
  }

  /**
   * List all available email templates
   */
  @Get("templates")
  @ApiOperation({
    summary: "List all available email templates",
    description: "Returns all email templates with their required variables",
  })
  @ApiResponse({
    status: 200,
    description: "Templates retrieved successfully",
    schema: {
      example: [
        {
          type: "VERIFY_EMAIL",
          subject: "Verify your email address",
          requiredVariables: ["firstName", "verifyUrl"],
        },
        {
          type: "WELCOME_PRIVATE",
          subject: "Welcome to OnlyUsedTesla",
          requiredVariables: ["firstName", "dashboardUrl"],
        },
      ],
    },
  })
  async listTemplates() {
    return this.emailsService.listTemplates();
  }

  /**
   * Get template configuration
   */
  @Get("templates/:type")
  @ApiOperation({
    summary: "Get template configuration",
    description: "Returns configuration for a specific email template",
  })
  @ApiParam({
    name: "type",
    enum: EmailTemplateType,
    description: "Email template type",
  })
  @ApiResponse({
    status: 200,
    description: "Template config retrieved",
    schema: {
      example: {
        type: "VERIFY_EMAIL",
        sendGridTemplateId: "d-abc123...",
        subject: "Verify your email address",
        requiredVariables: ["firstName", "verifyUrl"],
      },
    },
  })
  @ApiResponse({ status: 400, description: "Template not found" })
  async getTemplate(@Param("type") type: EmailTemplateType) {
    return this.emailsService.getTemplateConfig(type);
  }
}
