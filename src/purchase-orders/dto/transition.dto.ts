import { IsString, IsNotEmpty, IsIn } from 'class-validator';

const VALID_STATUSES = ['draft', 'pending_approval', 'approved', 'sent', 'received', 'rejected'] as const;

export class TransitionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_STATUSES, { message: 'Invalid target status' })
  status!: string;
}
