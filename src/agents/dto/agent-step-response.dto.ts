export class AgentStepResponseDto {
  id!: string;
  agentRunId!: string;
  stepNumber!: number;
  input!: object | null;
  output!: object | null;
  reasoning!: string | null;
  timestamp!: Date;
}
