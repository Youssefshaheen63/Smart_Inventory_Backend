import { AgentRunResponseDto } from './agent-run-response.dto';
import { AgentStepResponseDto } from './agent-step-response.dto';

export class AgentRunDetailsResponseDto {
  run!: AgentRunResponseDto;
  steps!: AgentStepResponseDto[];
}
