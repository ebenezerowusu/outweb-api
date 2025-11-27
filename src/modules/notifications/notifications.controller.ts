import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
import { NotificationsService } from "./notifications.service";
import {
  MarkNotificationReadDto,
  ArchiveNotificationDto,
  UpdateNotificationPreferencesDto,
} from "./dto/update-notification.dto";
import { QueryNotificationsDto } from "./dto/query-notification.dto";
import { CurrentUser } from "@/common/decorators/auth.decorators";

/**
 * Notifications Controller
 * Handles user notifications and preferences
 */
@ApiTags("Notifications")
@Controller("notifications")
@ApiBearerAuth("Authorization")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * List current user's notifications
   */
  @Get()
  @ApiOperation({ summary: "List current user notifications" })
  @ApiResponse({
    status: 200,
    description: "Notifications retrieved successfully",
  })
  async findAll(
    @Query() query: QueryNotificationsDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.findAll(user.sub, query);
  }

  /**
   * Get unread count
   */
  @Get("unread/count")
  @ApiOperation({ summary: "Get unread notifications count" })
  @ApiResponse({
    status: 200,
    description: "Unread count retrieved successfully",
  })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.sub);
    return { unreadCount: count };
  }

  /**
   * Get notification preferences
   */
  @Get("preferences")
  @ApiOperation({ summary: "Get notification preferences" })
  @ApiResponse({
    status: 200,
    description: "Preferences retrieved successfully",
  })
  async getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getPreferences(user.sub);
  }

  /**
   * Update notification preferences
   */
  @Patch("preferences")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update notification preferences" })
  @ApiResponse({ status: 200, description: "Preferences updated successfully" })
  async updatePreferences(
    @Body() updatePreferencesDto: UpdateNotificationPreferencesDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.updatePreferences(
      user.sub,
      updatePreferencesDto,
    );
  }

  /**
   * Mark all notifications as read
   */
  @Post("mark-all-read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({ status: 200, description: "All notifications marked as read" })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  /**
   * Get notification by ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Get notification by ID" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({
    status: 200,
    description: "Notification retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.notificationsService.findOne(id, user.sub);
  }

  /**
   * Mark notification as read/unread
   */
  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark notification as read or unread" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({
    status: 200,
    description: "Notification updated successfully",
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async markAsRead(
    @Param("id") id: string,
    @Body() markReadDto: MarkNotificationReadDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markAsRead(id, user.sub, markReadDto);
  }

  /**
   * Archive notification
   */
  @Patch(":id/archive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Archive or unarchive notification" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({
    status: 200,
    description: "Notification archived successfully",
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async archive(
    @Param("id") id: string,
    @Body() archiveDto: ArchiveNotificationDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.archive(id, user.sub, archiveDto);
  }

  /**
   * Delete notification
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete notification" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({
    status: 204,
    description: "Notification deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async delete(@Param("id") id: string, @CurrentUser() user: any) {
    await this.notificationsService.delete(id, user.sub);
  }
}
