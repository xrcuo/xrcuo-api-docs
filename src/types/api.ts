export interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
  defaultValue?: string
  example?: string
}

export interface ApiHeader {
  name: string
  required: boolean
  description: string
  example?: string
}

export interface ApiResponseExample {
  statusCode: number
  description: string
  contentType: string
  body: string
}

export interface ApiResponseSchema {
  field: string
  type: string
  description: string
  required: boolean
}

export interface ApiEndpoint {
  id: string
  name: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  category: string
  tags: string[]
  parameters?: ApiParameter[]
  headers?: ApiHeader[]
  requestBody?: {
    contentType: string
    description: string
    schema: ApiParameter[]
    example: string
  }
  responses: {
    statusCode: number
    description: string
    schema?: ApiResponseSchema[]
    examples: ApiResponseExample[]
  }[]
}

export interface ApiDocForm {
  id?: number
  name: string
  path: string
  method: string
  description: string
  category: string
  tags: string[]
  parameters: ApiParameter[]
  headers: ApiHeader[]
  requestBody?: {
    contentType: string
    description: string
    schema: ApiParameter[]
    example: string
  }
  responses: {
    statusCode: number
    description: string
    schema?: ApiResponseSchema[]
    examples: ApiResponseExample[]
  }[]
}
