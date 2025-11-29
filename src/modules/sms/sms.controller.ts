import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { SmsService } from "./sms.service";
import { SendSmsDto } from "./dto/send-sms.dto";
import { SendBatchSmsDto } from "./dto/send-batch-sms.dto";
import { SmsTemplateType } from "./interfaces/sms-template.interface";

@ApiTags("SMS")
@ApiBearerAuth()
@Controller("sms")
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  /**
   * Send SMS using template (single recipient or broadcast)
   * Broadcast mode: same message content to multiple recipients
   */
  @Post("send")
  @ApiOperation({
    summary: "Send SMS using template",
    description:
      "Send SMS to a single recipient or broadcast same message to multiple recipients using a predefined template",
  })
  @ApiResponse({
    status: 201,
    description: "SMS sent successfully",
    schema: {
      example: {
        success: true,
        sent: 2,
        failed: 0,
        results: [
          {
            phoneNumber: "+14155551234",
            success: true,
            messageSid: "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
          {
            phoneNumber: "+14155555678",
            success: true,
            messageSid: "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - validation error or missing variables",
  })
  async sendSms(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(dto);
  }

  /**
   * Send batch SMS with personalized content
   * Each recipient gets their own unique variables
   */
  @Post("send-batch")
  @ApiOperation({
    summary: "Send personalized batch SMS",
    description:
      "Send personalized SMS to multiple recipients - each recipient can have different variables",
  })
  @ApiResponse({
    status: 201,
    description: "Batch SMS sent successfully",
    schema: {
      example: {
        success: true,
        sent: 2,
        failed: 0,
        results: [
          {
            phoneNumber: "+14155551234",
            success: true,
            messageSid: "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
          {
            phoneNumber: "+14155555678",
            success: true,
            messageSid: "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - validation error or missing variables",
  })
  async sendBatchSms(@Body() dto: SendBatchSmsDto) {
    return this.smsService.sendBatchSms(dto);
  }

  /**
   * Get all available SMS templates
   */
  @Get("templates")
  @ApiOperation({
    summary: "List all SMS templates",
    description: "Get all available SMS templates with their configurations",
  })
  @ApiResponse({
    status: 200,
    description: "List of all SMS templates",
    schema: {
      example: {
        MFA_CODE: {
          type: "MFA_CODE",
          twilioTemplateId: "HX956dc77b9b86127d324de9c81963271b",
          defaultMessage:
            "[OnlyUsedTesla] Your code is {{code}} (expires in {{expiresMinutes}}m). If you didn't request this, ignore.",
          requiredVariables: ["code", "expiresMinutes"],
        },
      },
    },
  })
  async listTemplates() {
    return this.smsService.getTemplates();
  }

  /**
   * Get a specific SMS template by type
   */
  @Get("templates/:type")
  @ApiOperation({
    summary: "Get SMS template by type",
    description: "Get configuration for a specific SMS template",
  })
  @ApiResponse({
    status: 200,
    description: "SMS template configuration",
    schema: {
      example: {
        type: "MFA_CODE",
        twilioTemplateId: "HX956dc77b9b86127d324de9c81963271b",
        defaultMessage:
          "[OnlyUsedTesla] Your code is {{code}} (expires in {{expiresMinutes}}m). If you didn't request this, ignore.",
        requiredVariables: ["code", "expiresMinutes"],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Template not found",
  })
  async getTemplate(@Param("type") type: SmsTemplateType) {
    return this.smsService.getTemplate(type);
  }
}
