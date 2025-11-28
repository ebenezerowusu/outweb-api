import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from "@sendgrid/mail";
import { SendEmailDto } from "./dto/send-email.dto";
import { SendBatchEmailDto } from "./dto/send-batch-email.dto";
import { EMAIL_TEMPLATES } from "./configs/email-templates.config";
import {
  EmailTemplateType,
  EmailTemplate,
  EmailRecipient,
  SendEmailResult,
} from "./interfaces/email-template.interface";

/**
 * Emails Service
 * Handles email sending via SendGrid with template support
 */
@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    // Initialize SendGrid
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      this.logger.log("SendGrid initialized successfully");
    } else {
      this.isConfigured = false;
      this.logger.warn(
        "SendGrid API key not configured - emails will not be sent",
      );
    }
  }

  /**
   * Send email to single or multiple recipients (same variables)
   */
  async sendTemplateEmail(dto: SendEmailDto): Promise<SendEmailResult> {
    if (!this.isConfigured) {
      throw new BadRequestException("Email service is not configured");
    }

    // Validate that either recipient or recipients is provided
    if (!dto.recipient && (!dto.recipients || dto.recipients.length === 0)) {
      throw new BadRequestException(
        "Either 'recipient' or 'recipients' must be provided",
      );
    }

    if (dto.recipient && dto.recipients) {
      throw new BadRequestException(
        "Cannot use both 'recipient' and 'recipients'",
      );
    }

    // Get template config
    const template = EMAIL_TEMPLATES[dto.templateType];
    if (!template) {
      throw new BadRequestException(
        `Template '${dto.templateType}' not found`,
      );
    }

    // Validate required variables
    this.validateVariables(dto.templateType, dto.variables);

    // Normalize to array (safe because we validated that one exists above)
    const recipients = dto.recipients || (dto.recipient ? [dto.recipient] : []);

    // Send emails
    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        this.sendSingleEmail(template, recipient, dto.variables, dto.replyTo),
      ),
    );

    // Summarize results
    return this.processResults(results, recipients);
  }

  /**
   * Send personalized emails to multiple recipients
   */
  async sendPersonalizedBatch(
    dto: SendBatchEmailDto,
  ): Promise<SendEmailResult> {
    if (!this.isConfigured) {
      throw new BadRequestException("Email service is not configured");
    }

    const template = EMAIL_TEMPLATES[dto.templateType];
    if (!template) {
      throw new BadRequestException(
        `Template '${dto.templateType}' not found`,
      );
    }

    // Validate all variables
    for (const email of dto.emails) {
      this.validateVariables(dto.templateType, email.variables);
    }

    // Send emails in parallel
    const results = await Promise.allSettled(
      dto.emails.map((email) =>
        this.sendSingleEmail(
          template,
          email.recipient,
          email.variables,
          dto.replyTo,
        ),
      ),
    );

    // Summarize results
    const recipients = dto.emails.map((email) => email.recipient);
    return this.processResults(results, recipients);
  }

  /**
   * Send single email (internal method)
   */
  private async sendSingleEmail(
    template: EmailTemplate,
    recipient: EmailRecipient,
    variables: Record<string, any>,
    replyTo?: string,
  ): Promise<void> {
    const msg = {
      to: {
        email: recipient.email,
        name: recipient.name,
      },
      from: {
        email:
          this.configService.get<string>("SENDGRID_FROM_EMAIL") ||
          "noreply@onlyusedtesla.com",
        name:
          this.configService.get<string>("SENDGRID_FROM_NAME") ||
          "OnlyUsedTesla",
      },
      replyTo,
      templateId: template.sendGridTemplateId,
      dynamicTemplateData: variables,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent: ${template.type} to ${recipient.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${recipient.email}:`,
        error.response?.body || error,
      );
      throw error;
    }
  }

  /**
   * Validate that all required variables are present
   */
  private validateVariables(
    templateType: EmailTemplateType,
    variables: Record<string, any>,
  ): void {
    const template = EMAIL_TEMPLATES[templateType];
    const missing = template.requiredVariables.filter(
      (varName) => !(varName in variables) || variables[varName] === undefined,
    );

    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required variables for ${templateType}: ${missing.join(", ")}`,
      );
    }
  }

  /**
   * Process results from Promise.allSettled
   */
  private processResults(
    results: PromiseSettledResult<void>[],
    recipients: EmailRecipient[],
  ): SendEmailResult {
    let sent = 0;
    let failed = 0;
    const detailedResults = results.map((result, index) => {
      const email = recipients[index].email;

      if (result.status === "fulfilled") {
        sent++;
        return { email, success: true };
      } else {
        failed++;
        return {
          email,
          success: false,
          error: result.reason?.message || "Unknown error",
        };
      }
    });

    this.logger.log(`Email batch: ${sent} succeeded, ${failed} failed`);

    return {
      sent,
      failed,
      results: detailedResults,
    };
  }

  /**
   * Get template configuration (for debugging/documentation)
   */
  getTemplateConfig(templateType: EmailTemplateType): EmailTemplate {
    const template = EMAIL_TEMPLATES[templateType];
    if (!template) {
      throw new BadRequestException(
        `Template '${templateType}' not found`,
      );
    }
    return template;
  }

  /**
   * List all available templates
   */
  listTemplates(): Array<{
    type: string;
    subject: string;
    requiredVariables: string[];
  }> {
    return Object.values(EMAIL_TEMPLATES).map((template) => ({
      type: template.type,
      subject: template.subject,
      requiredVariables: template.requiredVariables,
    }));
  }
}
