import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { IdempotencyKeyEntity } from '../entities/idempotency-key.entity';

export type CheckAndAcquireResult =
  | 'new'
  | 'in-progress'
  | { response: Record<string, unknown> };

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyKeyEntity)
    private readonly repo: Repository<IdempotencyKeyEntity>,
  ) {}

  async checkAndAcquire(key: string): Promise<CheckAndAcquireResult> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await this.repo.insert({ key, expiresAt, response: null });
      return 'new';
    } catch (error: any) {
      // PostgreSQL unique violation error code: 23505
      if (error?.code === '23505') {
        const existing = await this.repo.findOneBy({ key });

        if (!existing || existing.response === null) {
          return 'in-progress';
        }

        return { response: existing.response };
      }

      throw error;
    }
  }

  async storeResponse(key: string, response: unknown): Promise<void> {
    await this.repo.update({ key }, { response: response as any });
  }

  async cleanupExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
