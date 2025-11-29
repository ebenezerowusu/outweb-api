import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as twilio from "twilio";
import {
  SmsTemplate,
  SmsTemplateType,
  SmsRecipient,
  SendSmsResult,
} from "./interfaces/sms-template.interface";
import { SMS_TEMPLATES } from "./configs/sms-templates.config";
import { SendSmsDto } from "./dto/send-sms.dto";
import { SendBatchSmsDto } from "./dto/send-batch-sms.dto";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioClient: twilio.Twilio;
  private readonly messagingServiceSid?: string;
  private readonly phoneNumber?: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>("TWILIO_ACCOUNT_SID");
    const authToken = this.configService.get<string>("TWILIO_AUTH_TOKEN");
    this.messagingServiceSid = this.configService.get<string>(
      "TWILIO_MESSAGING_SERVICE_SID",
    );
    this.phoneNumber = this.configService.get<string>("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken) {
      throw new Error(
        "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN",
      );
    }

    this.twilioClient = twilio(accountSid, authToken);
    this.logger.log("Twilio SMS service initialized");
  }

  /**
   * Send SMS using template (single recipient or broadcast)
   */
  async sendTemplateSms(dto: SendSmsDto): Promise<SendSmsResult> {
    // Validate that either recipient or recipients is provided
    if (!dto.recipient && (!dto.recipients || dto.recipients.length === 0)) {
      throw new BadRequestException(
        "Either 'recipient' or 'recipients' must be provided",
      );
    }

    // Get template configuration
    const template = this.getTemplate(dto.templateType);

    // Validate required variables
    this.validateVariables(template, dto.variables);

    // Normalize to array
    const recipients = dto.recipients || (dto.recipient ? [dto.recipient] : []);

    // Send SMS messages in parallel
    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        this.sendSingleSms(template, recipient, dto.variables),
      ),
    );

    return this.processResults(results, recipients);
  }

  /**
   * Send batch SMS with personalized variables for each recipient
   */
  async sendBatchSms(dto: SendBatchSmsDto): Promise<SendSmsResult> {
    // Get template configuration
    const template = this.getTemplate(dto.templateType);

    // Validate variables for each message
    dto.messages.forEach((msg, index) => {
      try {
        this.validateVariables(template, msg.variables);
      } catch (error) {
        throw new BadRequestException(
          `Message at index ${index} (${msg.recipient.phoneNumber}): ${error.message}`,
        );
      }
    });

    // Send SMS messages in parallel with personalized variables
    const results = await Promise.allSettled(
      dto.messages.map((msg) =>
        this.sendSingleSms(template, msg.recipient, msg.variables),
      ),
    );

    const recipients = dto.messages.map((msg) => msg.recipient);
    return this.processResults(results, recipients);
  }

  /**
   * Get all available SMS templates
   */
  getTemplates(): Record<SmsTemplateType, SmsTemplate> {
    return SMS_TEMPLATES;
  }

  /**
   * Get a specific SMS template by type
   */
  getTemplate(templateType: SmsTemplateType): SmsTemplate {
    const template = SMS_TEMPLATES[templateType];
    if (!template) {
      throw new BadRequestException(
        `SMS template '${templateType}' not found`,
      );
    }
    return template;
  }

  /**
   * Send a single SMS message
   */
  private async sendSingleSms(
    template: SmsTemplate,
    recipient: SmsRecipient,
    variables: Record<string, any>,
  ): Promise<{ messageSid: string; phoneNumber: string }> {
    try {
      // Interpolate variables into the message
      const messageBody = this.interpolateMessage(
        template.defaultMessage,
        variables,
      );

      // Determine the "from" value
      const from = this.messagingServiceSid || this.phoneNumber;

      if (!from) {
        throw new Error(
          "Either TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER must be configured",
        );
      }

      // Send SMS using Twilio
      const createOptions: any = {
        body: messageBody,
        to: recipient.phoneNumber,
      };

      // Use messaging service SID if available, otherwise use phone number
      if (this.messagingServiceSid) {
        createOptions.messagingServiceSid = this.messagingServiceSid;
      } else {
        createOptions.from = this.phoneNumber;
      }

      const message = await this.twilioClient.messages.create(createOptions);

      this.logger.log(
        `SMS sent successfully to ${recipient.phoneNumber} (SID: ${message.sid})`,
      );

      return {
        messageSid: message.sid,
        phoneNumber: recipient.phoneNumber,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${recipient.phoneNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Interpolate variables into message template
   */
  private interpolateMessage(
    template: string,
    variables: Record<string, any>,
  ): string {
    let message = template;

    // Replace all {{variable}} placeholders
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      message = message.replace(regex, String(variables[key]));
    });

    return message;
  }

  /**
   * Validate that all required variables are provided
   */
  private validateVariables(
    template: SmsTemplate,
    variables: Record<string, any>,
  ): void {
    const missingVars = template.requiredVariables.filter(
      (varName) => !(varName in variables),
    );

    if (missingVars.length > 0) {
      throw new BadRequestException(
        `Missing required variables for template '${template.type}': ${missingVars.join(", ")}`,
      );
    }
  }

  /**
   * Process Promise.allSettled results and compile SendSmsResult
   */
  private processResults(
    results: PromiseSettledResult<{
      messageSid: string;
      phoneNumber: string;
    }>[],
    recipients: SmsRecipient[],
  ): SendSmsResult {
    const compiledResults = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return {
          phoneNumber: recipients[index].phoneNumber,
          success: true,
          messageSid: result.value.messageSid,
        };
      } else {
        return {
          phoneNumber: recipients[index].phoneNumber,
          success: false,
          error: result.reason?.message || "Unknown error",
        };
      }
    });

    const sent = compiledResults.filter((r) => r.success).length;
    const failed = compiledResults.filter((r) => !r.success).length;

    return {
      success: failed === 0,
      sent,
      failed,
      results: compiledResults,
    };
  }
}
