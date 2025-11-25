import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { SignInDto } from './dto/signin.dto';
import { SignUpPrivateDto } from './dto/signup-private.dto';
import { SignUpDealerDto } from './dto/signup-dealer.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestEmailVerificationDto, ConfirmEmailVerificationDto } from './dto/verify-email.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Setup2FaDto, Disable2FaDto } from './dto/two-factor.dto';
import { SkipAuth, CurrentUser, Country } from '@/common/decorators/auth.decorators';

/**
 * Auth Controller
 * Handles all authentication endpoints
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Sign in with email and password
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @SkipAuth()
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully signed in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account is blocked' })
  @ApiResponse({ status: 409, description: 'Account is inactive' })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  /**
   * Sign up as private user
   */
  @Post('signup/private')
  @HttpCode(HttpStatus.CREATED)
  @SkipAuth()
  @ApiOperation({ summary: 'Register as a private user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async signUpPrivate(
    @Body() signUpPrivateDto: SignUpPrivateDto,
    @Country() country: string,
  ) {
    return this.authService.signUpPrivate(signUpPrivateDto, country);
  }

  /**
   * Sign up as dealer user
   */
  @Post('signup/dealer')
  @HttpCode(HttpStatus.CREATED)
  @SkipAuth()
  @ApiOperation({ summary: 'Register as a dealer user' })
  @ApiResponse({ status: 201, description: 'Dealer account created successfully' })
  @ApiResponse({ status: 400, description: 'Stripe error or invalid subscription IDs' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async signUpDealer(
    @Body() signUpDealerDto: SignUpDealerDto,
    @Country() country: string,
  ) {
    return this.authService.signUpDealer(signUpDealerDto, country);
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SkipAuth()
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New tokens generated' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  /**
   * Logout (invalidate refresh token)
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    // TODO: Implement token blacklist/revocation
    return {
      statusCode: 200,
      message: 'Logged out successfully',
    };
  }

  /**
   * Get current user
   */
  @Get('me')
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.sub);
  }

  /**
   * Request email verification
   */
  @Post('verify-email/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @SkipAuth()
  @ApiOperation({ summary: 'Request email verification link' })
  @ApiResponse({ status: 202, description: 'Verification email sent if account exists' })
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.authService.requestEmailVerification(dto);
  }

  /**
   * Confirm email verification
   */
  @Post('verify-email/confirm')
  @HttpCode(HttpStatus.OK)
  @SkipAuth()
  @ApiOperation({ summary: 'Confirm email verification with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async confirmEmailVerification(@Body() dto: ConfirmEmailVerificationDto) {
    return this.authService.confirmEmailVerification(dto);
  }

  /**
   * Forgot password
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @SkipAuth()
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiResponse({ status: 202, description: 'Password reset link sent if account exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * Reset password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @SkipAuth()
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * Setup 2FA
   */
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setup2FA(@Body() dto: Setup2FaDto, @CurrentUser() user: any) {
    return this.authService.setup2FA(dto, user.sub);
  }

  /**
   * Disable 2FA
   */
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async disable2FA(@Body() dto: Disable2FaDto, @CurrentUser() user: any) {
    return this.authService.disable2FA(dto, user.sub);
  }
}
