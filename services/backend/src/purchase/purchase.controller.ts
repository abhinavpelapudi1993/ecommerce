import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { ListPurchasesDto } from './dto/list-purchases.dto';
import { CreateRefundRequestDto } from './dto/refund-request.dto';
import { ApproveRefundRequestDto } from './dto/refund-request.dto';
import { RejectRefundRequestDto } from './dto/refund-request.dto';
import type { PurchaseResponse, PurchaseListResponse } from './dto/purchase-response.dto';
import { IdempotencyGuard } from '../common/guards/idempotency.guard';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';
import { Idempotent } from '../common/decorators/idempotent.decorator';

@Controller()
@UseGuards(IdempotencyGuard)
@UseInterceptors(IdempotencyInterceptor)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  // ─── Purchases ──────────────────────────────────────────────────

  @Post('purchases')
  @Idempotent()
  createPurchase(@Body() dto: CreatePurchaseDto): Promise<PurchaseResponse> {
    return this.purchaseService.createPurchase(dto);
  }

  @Get('purchases')
  listPurchases(@Query() dto: ListPurchasesDto): Promise<PurchaseListResponse> {
    return this.purchaseService.listPurchases(dto);
  }

  @Get('purchases/:purchaseId')
  getPurchase(@Param('purchaseId') purchaseId: string): Promise<PurchaseResponse> {
    return this.purchaseService.getPurchase(purchaseId);
  }

  @Get('purchases/:purchaseId/transactions')
  getTransactions(@Param('purchaseId') purchaseId: string) {
    return this.purchaseService.getTransactions(purchaseId);
  }

  @Post('purchases/:purchaseId/cancel')
  @Idempotent()
  cancelPurchase(
    @Param('purchaseId') purchaseId: string,
    @Body() body: { customerId: string },
  ): Promise<PurchaseResponse> {
    return this.purchaseService.cancelPurchase(purchaseId, body.customerId);
  }

  // ─── Shipment Status (auto-settles on delivery) ─────────────────

  @Patch('shipments/:shipmentId')
  @Idempotent()
  updateShipmentStatus(
    @Param('shipmentId') shipmentId: string,
    @Body() body: { status: string },
  ) {
    return this.purchaseService.updateShipmentStatus(shipmentId, body.status);
  }

  // ─── Refund Requests ────────────────────────────────────────────

  @Post('purchases/:purchaseId/refund-request')
  createRefundRequest(
    @Param('purchaseId') purchaseId: string,
    @Body() dto: CreateRefundRequestDto,
  ) {
    return this.purchaseService.createRefundRequest(
      dto.customerId,
      purchaseId,
      dto.type,
      dto.reason,
      dto.requestedAmount,
    );
  }

  @Get('refund-requests')
  listRefundRequests(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.purchaseService.listRefundRequests({ status, customerId });
  }

  @Post('refund-requests/:requestId/approve')
  @Idempotent()
  approveRefundRequest(
    @Param('requestId') requestId: string,
    @Body() dto: ApproveRefundRequestDto,
  ) {
    return this.purchaseService.approveRefundRequest(
      requestId,
      dto.amount,
      dto.note,
    );
  }

  @Post('refund-requests/:requestId/reject')
  rejectRefundRequest(
    @Param('requestId') requestId: string,
    @Body() dto: RejectRefundRequestDto,
  ) {
    return this.purchaseService.rejectRefundRequest(requestId, dto.note);
  }

  // ─── Company Balance ────────────────────────────────────────────

  @Get('company/balance')
  getCompanyBalance() {
    return this.purchaseService.getCompanyBalance();
  }

  // ─── Support Users ──────────────────────────────────────────────

  @Get('auth/support-users')
  findSupportUser(@Query('email') email: string) {
    return this.purchaseService.findSupportUserByEmail(email);
  }

  @Get('auth/support-users/:id')
  getSupportUser(@Param('id') id: string) {
    return this.purchaseService.getSupportUser(id);
  }
}
