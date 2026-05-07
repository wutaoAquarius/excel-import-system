/**
 * 订单相关类型定义
 */
export interface Order {
  id?: number;
  external_code?: string | null;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  weight: number;
  quantity: number;
  temperature: '常温' | '冷藏' | '冷冻';
  remark?: string | null;
  batch_number?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 模板映射规则
 */
export interface TemplateMapping {
  id?: number;
  template_fingerprint: string;
  mapping_rules: Record<string, string>;
  header_names: string[];
  created_at?: Date;
  last_used_at?: Date;
  usage_count?: number;
}

/**
 * 导入批次信息
 */
export interface ImportBatch {
  id?: number;
  batch_number: string;
  total_count: number;
  success_count?: number;
  failed_count?: number;
  status?: 'processing' | 'success' | 'partial_failed' | 'failed';
  error_details?: any;
  created_at?: Date;
  completed_at?: Date;
}

/**
 * 校验错误信息
 */
export interface ValidationError {
  rowIndex?: number;
  rowNumber?: number;
  field: string;
  type: 'required' | 'format' | 'type' | 'enum' | 'duplicate' | 'duplicate_history' | 'other';
  message: string;
}

/**
 * 校验规则
 */
export interface ValidationRule {
  field: string;
  required: boolean;
  pattern?: RegExp;
  type?: 'string' | 'number' | 'integer' | 'date';
  min?: number;
  max?: number;
  enum?: string[];
  unique?: boolean;
  checkHistory?: boolean;
  message?: string;
}

/**
 * 文件上传响应
 */
export interface UploadResponse {
  success: boolean;
  data?: {
    headers: string[];
    rows: any[][];
    rowCount: number;
  };
  error?: string;
}

/**
 * 模板匹配响应
 */
export interface MatchResponse {
  success: boolean;
  data?: {
    fingerprint: string;
    mapping: Record<string, string>;
    unmapped: string[];
    confidence: number;
    foundHistorical: boolean;
  };
  error?: string;
}

/**
 * 校验响应
 */
export interface ValidateResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    errors: ValidationError[];
    errorCount: number;
    affectedRows: number;
    errorSummary: string;
  };
  error?: string;
}

/**
 * 订单提交响应
 */
export interface SubmitResponse {
  success: boolean;
  data?: {
    batchNumber: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    status: string;
  };
  error?: string;
}

/**
 * 订单查询响应
 */
export interface SearchResponse {
  success: boolean;
  data?: {
    orders: Order[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

/**
 * 导入状态
 */
export interface ImportState {
  stage: 'upload' | 'mapping' | 'preview' | 'submit' | 'complete';
  uploadedFile: File | null;
  headers: string[];
  rawRows: any[][];
  columnMapping: Record<string, string>;
  unmappedColumns: string[];
  confidence: number;
  templateFingerprint?: string;
  processedRows?: Order[];
  errors?: ValidationError[];
  batchNumber?: string;
}
