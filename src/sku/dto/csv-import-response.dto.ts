import { ApiProperty } from '@nestjs/swagger';

export class CsvImportErrorDto {
  @ApiProperty({ example: 5, description: '1-based row number in the CSV data' })
  row!: number;

  @ApiProperty({
    example: 'SKU005',
    nullable: true,
    description: 'SKU code associated with the failing row if available',
  })
  skuCode?: string | null;

  @ApiProperty({
    example: 'SKU code "SKU005" already exists',
    description: 'Detailed validation or business rule failure message',
  })
  message!: string;
}


export class CsvImportResponseDto {
  @ApiProperty({ example: 100, description: 'Total data rows evaluated from CSV' })
  totalRows!: number;

  @ApiProperty({ example: 97, description: 'Number of successfully created SKUs' })
  successful!: number;

  @ApiProperty({ example: 3, description: 'Number of rows that failed validation or business rules' })
  failed!: number;

  @ApiProperty({
    type: [CsvImportErrorDto],
    description: 'List of error details for failed rows',
  })
  errors!: CsvImportErrorDto[];
}
