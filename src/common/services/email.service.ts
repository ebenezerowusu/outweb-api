import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { AppConfig } from '@/config/app.config';

/**
 * Email Service
 * Handles all email sending via SendGrid with dynamic templates
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const apiKey = this.configService.get('sendgridApiKey', { infer: true });
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    to: string,
    data: { firstName: string; verifyUrl: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplVerifyEmail', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send welcome email for private users
   */
  async sendWelcomePrivateEmail(
    to: string,
    data: { firstName: string; dashboardUrl: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplWelcomePrivate', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send welcome email for dealers
   */
  async sendWelcomeDealerEmail(
    to: string,
    data: { firstName: string; dealerName: string; dealerDashboardUrl: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplWelcomeDealer', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send password reset email
   */
  async sendResetPasswordEmail(
    to: string,
    data: { firstName: string; resetUrl: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplResetPassword', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send MFA code via email
   */
  async sendMfaCodeEmail(
    to: string,
    data: { firstName: string; code: string; expiresMinutes: number },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplMfaCodeEmail', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send email change verification
   */
  async sendChangeEmailVerifyEmail(
    to: string,
    data: { firstName: string; verifyUrl: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplChangeEmailVerify', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send new login alert
   */
  async sendNewLoginAlertEmail(
    to: string,
    data: {
      firstName: string;
      time: string;
      ip: string;
      city: string;
      userAgent: string;
    },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplNewLoginAlert', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send dealer application received email
   */
  async sendDealerAppReceivedEmail(
    to: string,
    data: { dealerName: string; submittedAt: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplDealerAppReceived', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send dealer application approved email
   */
  async sendDealerAppApprovedEmail(
    to: string,
    data: { dealerName: string; dealerDashboardUrl: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplDealerAppApproved', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send dealer application rejected email
   */
  async sendDealerAppRejectedEmail(
    to: string,
    data: { dealerName: string; reason: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplDealerAppRejected', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send KYC approved email
   */
  async sendKycApprovedEmail(
    to: string,
    data: { sellerName: string; dashboardUrl: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplKycApproved', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send KYC rejected email
   */
  async sendKycRejectedEmail(
    to: string,
    data: { sellerName: string; reason: string; resubmitUrl: string },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplKycRejected', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send dealer staff invite email
   */
  async sendDealerStaffInviteEmail(
    to: string,
    data: {
      inviterName: string;
      dealerName: string;
      inviteEmail: string;
      setPasswordUrl: string;
    },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplDealerStaffInvite', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send role changed email
   */
  async sendRoleChangedEmail(
    to: string,
    data: {
      fullName: string;
      oldRole: string;
      newRole: string;
      dashboardUrl: string;
    },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplRoleChanged', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Send cash offer alert email
   */
  async sendCashOfferAlertEmail(
    to: string,
    data: {
      listingShortId: string;
      countryCode: string;
      make: string;
      model: string;
      year: string;
      trim: string;
      priceFormatted: string;
      sellerType: string;
      color: string;
      mileageFormatted: string;
      city: string;
      state: string;
      country: string;
      listingUrl: string;
      listingImage: string;
    },
  ): Promise<void> {
    const templateId = this.configService.get('sendgridTmplCashOfferAlert', { infer: true });
    await this.sendTemplateEmail(to, templateId!, data);
  }

  /**
   * Helper: Send templated email via SendGrid
   */
  private async sendTemplateEmail(
    to: string,
    templateId: string,
    dynamicTemplateData: Record<string, any>,
  ): Promise<void> {
    try {
      const fromEmail = this.configService.get('sendgridFromEmail', { infer: true });
      const fromName = this.configService.get('sendgridFromName', { infer: true });

      const msg = {
        to,
        from: {
          email: fromEmail!,
          name: fromName!,
        },
        templateId,
        dynamicTemplateData,
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${to} using template ${templateId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
