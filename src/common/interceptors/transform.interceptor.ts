import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interface untuk response yang sudah ditransformasi
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

interface ResponseData {
  message?: string;
  data?: unknown;
}

/**
 * Interceptor untuk membungkus semua response dengan format standar
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: ResponseData) => ({
        success: true,
        statusCode,
        message: data?.message || 'Success',
        data: (data?.data !== undefined ? data.data : data) as T,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
