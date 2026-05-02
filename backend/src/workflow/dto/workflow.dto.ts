import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { WorkflowNode, WorkflowEdge } from '../types';

// 创建工作流 DTO
export class CreateWorkflowDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsArray()
  nodes!: WorkflowNode[];

  @IsArray()
  edges!: WorkflowEdge[];
}

// 更新工作流 DTO - 所有字段可选
export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  nodes?: WorkflowNode[];

  @IsOptional()
  @IsArray()
  edges?: WorkflowEdge[];
}
