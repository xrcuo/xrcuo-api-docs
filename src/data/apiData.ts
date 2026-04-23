import type { ApiEndpoint } from '@/types/api'

export const apiEndpoints: ApiEndpoint[] = [
  {
    id: '1',
    name: '获取用户信息',
    path: '/api/v1/users/{id}',
    method: 'GET',
    description: '根据用户ID获取用户详细信息，包括基本资料、权限状态等',
    category: '用户管理',
    tags: ['用户', '查询'],
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: '用户唯一标识符',
        example: 'user_123456',
      },
      {
        name: 'include',
        type: 'string',
        required: false,
        description: '附加信息，可选值：profile,settings,logs',
        defaultValue: 'profile',
        example: 'profile,settings',
      },
    ],
    headers: [
      {
        name: 'Authorization',
        required: true,
        description: 'Bearer Token 认证信息',
        example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
      },
      {
        name: 'X-Request-ID',
        required: false,
        description: '请求唯一标识，用于链路追踪',
        example: 'req_abc123',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: '成功获取用户信息',
        schema: [
          { field: 'id', type: 'string', description: '用户ID', required: true },
          { field: 'username', type: 'string', description: '用户名', required: true },
          { field: 'email', type: 'string', description: '邮箱地址', required: true },
          { field: 'avatar', type: 'string', description: '头像URL', required: false },
          { field: 'createdAt', type: 'string', description: '创建时间（ISO 8601格式）', required: true },
          { field: 'status', type: 'string', description: '账户状态：active, inactive, suspended', required: true },
        ],
        examples: [
          {
            statusCode: 200,
            description: '标准成功响应',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                id: 'user_123456',
                username: 'zhangsan',
                email: 'zhangsan@example.com',
                avatar: 'https://cdn.example.com/avatars/123456.png',
                createdAt: '2024-01-15T08:30:00Z',
                status: 'active',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 404,
        description: '用户不存在',
        examples: [
          {
            statusCode: 404,
            description: '用户未找到',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                error: 'USER_NOT_FOUND',
                message: '指定的用户ID不存在',
                requestId: 'req_abc123',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 401,
        description: '未授权访问',
        examples: [
          {
            statusCode: 401,
            description: 'Token无效或已过期',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                error: 'UNAUTHORIZED',
                message: '认证信息无效或已过期',
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: '创建用户',
    path: '/api/v1/users',
    method: 'POST',
    description: '创建新用户账户，需要管理员权限',
    category: '用户管理',
    tags: ['用户', '创建'],
    headers: [
      {
        name: 'Authorization',
        required: true,
        description: 'Bearer Token 认证信息',
        example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
      },
      {
        name: 'Content-Type',
        required: true,
        description: '请求体格式',
        example: 'application/json',
      },
    ],
    requestBody: {
      contentType: 'application/json',
      description: '用户创建参数',
      schema: [
        { name: 'username', type: 'string', required: true, description: '用户名，3-20个字符', example: 'zhangsan' },
        { name: 'email', type: 'string', required: true, description: '邮箱地址', example: 'zhangsan@example.com' },
        { name: 'password', type: 'string', required: true, description: '密码，至少8位', example: 'SecurePass123!' },
        { name: 'role', type: 'string', required: false, description: '角色：user, admin, moderator', defaultValue: 'user', example: 'user' },
      ],
      example: JSON.stringify(
        {
          username: 'zhangsan',
          email: 'zhangsan@example.com',
          password: 'SecurePass123!',
          role: 'user',
        },
        null,
        2,
      ),
    },
    responses: [
      {
        statusCode: 201,
        description: '用户创建成功',
        schema: [
          { field: 'id', type: 'string', description: '新用户ID', required: true },
          { field: 'username', type: 'string', description: '用户名', required: true },
          { field: 'email', type: 'string', description: '邮箱', required: true },
          { field: 'createdAt', type: 'string', description: '创建时间', required: true },
        ],
        examples: [
          {
            statusCode: 201,
            description: '创建成功响应',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                id: 'user_789012',
                username: 'zhangsan',
                email: 'zhangsan@example.com',
                createdAt: '2024-06-20T14:30:00Z',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 400,
        description: '请求参数错误',
        examples: [
          {
            statusCode: 400,
            description: '参数校验失败',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                error: 'VALIDATION_ERROR',
                message: '请求参数校验失败',
                details: [
                  { field: 'email', message: '邮箱格式不正确' },
                  { field: 'password', message: '密码长度不能少于8位' },
                ],
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 403,
        description: '权限不足',
        examples: [
          {
            statusCode: 403,
            description: '非管理员禁止创建用户',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                error: 'FORBIDDEN',
                message: '需要管理员权限才能创建用户',
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  },
  {
    id: '3',
    name: '更新用户信息',
    path: '/api/v1/users/{id}',
    method: 'PUT',
    description: '更新指定用户的资料信息',
    category: '用户管理',
    tags: ['用户', '更新'],
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: '用户唯一标识符',
        example: 'user_123456',
      },
    ],
    headers: [
      {
        name: 'Authorization',
        required: true,
        description: 'Bearer Token 认证信息',
        example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
      },
      {
        name: 'Content-Type',
        required: true,
        description: '请求体格式',
        example: 'application/json',
      },
    ],
    requestBody: {
      contentType: 'application/json',
      description: '用户更新参数（支持部分更新）',
      schema: [
        { name: 'username', type: 'string', required: false, description: '新用户名', example: 'zhangsan_new' },
        { name: 'email', type: 'string', required: false, description: '新邮箱', example: 'new@example.com' },
        { name: 'avatar', type: 'string', required: false, description: '头像URL', example: 'https://cdn.example.com/avatar.png' },
      ],
      example: JSON.stringify(
        {
          username: 'zhangsan_new',
          email: 'new@example.com',
        },
        null,
        2,
      ),
    },
    responses: [
      {
        statusCode: 200,
        description: '更新成功',
        schema: [
          { field: 'id', type: 'string', description: '用户ID', required: true },
          { field: 'username', type: 'string', description: '更新后的用户名', required: true },
          { field: 'email', type: 'string', description: '更新后的邮箱', required: true },
          { field: 'updatedAt', type: 'string', description: '更新时间', required: true },
        ],
        examples: [
          {
            statusCode: 200,
            description: '更新成功响应',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                id: 'user_123456',
                username: 'zhangsan_new',
                email: 'new@example.com',
                updatedAt: '2024-06-20T15:00:00Z',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 404,
        description: '用户不存在',
        examples: [
          {
            statusCode: 404,
            description: '用户未找到',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                error: 'USER_NOT_FOUND',
                message: '指定的用户ID不存在',
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  },
  {
    id: '4',
    name: '删除用户',
    path: '/api/v1/users/{id}',
    method: 'DELETE',
    description: '删除指定用户账户（软删除，数据保留30天）',
    category: '用户管理',
    tags: ['用户', '删除'],
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: '用户唯一标识符',
        example: 'user_123456',
      },
    ],
    headers: [
      {
        name: 'Authorization',
        required: true,
        description: 'Bearer Token 认证信息',
        example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
      },
    ],
    responses: [
      {
        statusCode: 204,
        description: '删除成功（无响应体）',
        examples: [
          {
            statusCode: 204,
            description: '删除成功',
            contentType: 'application/json',
            body: '',
          },
        ],
      },
      {
        statusCode: 403,
        description: '不能删除管理员账户',
        examples: [
          {
            statusCode: 403,
            description: '权限拒绝',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                error: 'CANNOT_DELETE_ADMIN',
                message: '不能删除具有管理员权限的账户',
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  },
  {
    id: '5',
    name: '用户登录',
    path: '/api/v1/auth/login',
    method: 'POST',
    description: '用户登录接口，成功后返回 JWT Token',
    category: '认证授权',
    tags: ['认证', '登录'],
    headers: [
      {
        name: 'Content-Type',
        required: true,
        description: '请求体格式',
        example: 'application/json',
      },
    ],
    requestBody: {
      contentType: 'application/json',
      description: '登录凭证',
      schema: [
        { name: 'username', type: 'string', required: true, description: '用户名或邮箱', example: 'zhangsan' },
        { name: 'password', type: 'string', required: true, description: '登录密码', example: 'SecurePass123!' },
        { name: 'remember', type: 'boolean', required: false, description: '记住登录状态（7天）', defaultValue: 'false', example: 'true' },
      ],
      example: JSON.stringify(
        {
          username: 'zhangsan',
          password: 'SecurePass123!',
          remember: true,
        },
        null,
        2,
      ),
    },
    responses: [
      {
        statusCode: 200,
        description: '登录成功',
        schema: [
          { field: 'accessToken', type: 'string', description: '访问令牌（有效期2小时）', required: true },
          { field: 'refreshToken', type: 'string', description: '刷新令牌（有效期7天）', required: true },
          { field: 'expiresIn', type: 'number', description: '访问令牌过期时间（秒）', required: true },
          { field: 'user', type: 'object', description: '用户基本信息', required: true },
        ],
        examples: [
          {
            statusCode: 200,
            description: '登录成功响应',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                expiresIn: 7200,
                user: {
                  id: 'user_123456',
                  username: 'zhangsan',
                  email: 'zhangsan@example.com',
                },
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 401,
        description: '认证失败',
        examples: [
          {
            statusCode: 401,
            description: '用户名或密码错误',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                error: 'INVALID_CREDENTIALS',
                message: '用户名或密码错误',
                remainingAttempts: 3,
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  },
  {
    id: '6',
    name: '获取订单列表',
    path: '/api/v1/orders',
    method: 'GET',
    description: '分页获取当前用户的订单列表，支持状态筛选和排序',
    category: '订单管理',
    tags: ['订单', '列表', '分页'],
    parameters: [
      {
        name: 'page',
        type: 'integer',
        required: false,
        description: '页码，从1开始',
        defaultValue: '1',
        example: '1',
      },
      {
        name: 'pageSize',
        type: 'integer',
        required: false,
        description: '每页数量，最大100',
        defaultValue: '20',
        example: '20',
      },
      {
        name: 'status',
        type: 'string',
        required: false,
        description: '订单状态筛选：pending, paid, shipped, completed, cancelled',
        example: 'paid',
      },
      {
        name: 'sortBy',
        type: 'string',
        required: false,
        description: '排序字段：createdAt, totalAmount',
        defaultValue: 'createdAt',
        example: 'createdAt',
      },
      {
        name: 'sortOrder',
        type: 'string',
        required: false,
        description: '排序方向：asc, desc',
        defaultValue: 'desc',
        example: 'desc',
      },
    ],
    headers: [
      {
        name: 'Authorization',
        required: true,
        description: 'Bearer Token 认证信息',
        example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: '成功获取订单列表',
        schema: [
          { field: 'data', type: 'array', description: '订单数组', required: true },
          { field: 'pagination.page', type: 'number', description: '当前页码', required: true },
          { field: 'pagination.pageSize', type: 'number', description: '每页数量', required: true },
          { field: 'pagination.total', type: 'number', description: '总记录数', required: true },
          { field: 'pagination.totalPages', type: 'number', description: '总页数', required: true },
        ],
        examples: [
          {
            statusCode: 200,
            description: '分页订单列表',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                data: [
                  {
                    id: 'order_001',
                    orderNo: 'ORD20240620001',
                    status: 'paid',
                    totalAmount: 299.99,
                    currency: 'CNY',
                    createdAt: '2024-06-20T10:00:00Z',
                    items: [
                      { productId: 'prod_001', name: '无线蓝牙耳机', quantity: 1, price: 299.99 },
                    ],
                  },
                ],
                pagination: {
                  page: 1,
                  pageSize: 20,
                  total: 156,
                  totalPages: 8,
                },
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  },
  {
    id: '7',
    name: '创建订单',
    path: '/api/v1/orders',
    method: 'POST',
    description: '创建新订单，支持多种支付方式',
    category: '订单管理',
    tags: ['订单', '创建'],
    headers: [
      {
        name: 'Authorization',
        required: true,
        description: 'Bearer Token 认证信息',
        example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
      },
      {
        name: 'Content-Type',
        required: true,
        description: '请求体格式',
        example: 'application/json',
      },
      {
        name: 'Idempotency-Key',
        required: false,
        description: '幂等键，防止重复提交',
        example: 'idempotency_key_abc123',
      },
    ],
    requestBody: {
      contentType: 'application/json',
      description: '订单创建参数',
      schema: [
        { name: 'items', type: 'array', required: true, description: '订单商品列表', example: '[{"productId":"prod_001","quantity":2}]' },
        { name: 'shippingAddress', type: 'object', required: true, description: '收货地址信息', example: '{"province":"广东","city":"深圳"}' },
        { name: 'paymentMethod', type: 'string', required: true, description: '支付方式：alipay, wechat, card', example: 'alipay' },
        { name: 'couponCode', type: 'string', required: false, description: '优惠券代码', example: 'SUMMER2024' },
        { name: 'remark', type: 'string', required: false, description: '订单备注', example: '请尽快发货' },
      ],
      example: JSON.stringify(
        {
          items: [
            { productId: 'prod_001', quantity: 2 },
            { productId: 'prod_002', quantity: 1 },
          ],
          shippingAddress: {
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            detail: '科技园南路88号',
            contactName: '张三',
            contactPhone: '13800138000',
          },
          paymentMethod: 'alipay',
          remark: '请尽快发货',
        },
        null,
        2,
      ),
    },
    responses: [
      {
        statusCode: 201,
        description: '订单创建成功',
        schema: [
          { field: 'id', type: 'string', description: '订单ID', required: true },
          { field: 'orderNo', type: 'string', description: '订单编号', required: true },
          { field: 'status', type: 'string', description: '订单状态', required: true },
          { field: 'totalAmount', type: 'number', description: '订单总金额', required: true },
          { field: 'paymentUrl', type: 'string', description: '支付跳转链接', required: false },
          { field: 'expireAt', type: 'string', description: '订单过期时间', required: true },
        ],
        examples: [
          {
            statusCode: 201,
            description: '创建成功',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                id: 'order_789',
                orderNo: 'ORD20240620089',
                status: 'pending',
                totalAmount: 599.97,
                paymentUrl: 'https://pay.example.com/gateway/abc123',
                expireAt: '2024-06-20T16:00:00Z',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 422,
        description: '库存不足或商品已下架',
        examples: [
          {
            statusCode: 422,
            description: '业务校验失败',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                error: 'INSUFFICIENT_STOCK',
                message: '部分商品库存不足',
                details: [
                  { productId: 'prod_001', available: 1, requested: 2 },
                ],
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  },
  {
    id: '8',
    name: '文件上传',
    path: '/api/v1/files/upload',
    method: 'POST',
    description: '上传文件到服务器，支持图片、文档等多种格式',
    category: '文件管理',
    tags: ['文件', '上传'],
    headers: [
      {
        name: 'Authorization',
        required: true,
        description: 'Bearer Token 认证信息',
        example: 'Bearer eyJhbGciOiJIUzI1NiIs...',
      },
      {
        name: 'Content-Type',
        required: true,
        description: '必须为 multipart/form-data',
        example: 'multipart/form-data; boundary=----WebKitFormBoundary',
      },
    ],
    requestBody: {
      contentType: 'multipart/form-data',
      description: '文件上传表单',
      schema: [
        { name: 'file', type: 'file', required: true, description: '要上传的文件，最大10MB', example: 'image.jpg' },
        { name: 'folder', type: 'string', required: false, description: '存储目录：images, documents, temp', defaultValue: 'temp', example: 'images' },
        { name: 'isPublic', type: 'boolean', required: false, description: '是否公开访问', defaultValue: 'false', example: 'true' },
      ],
      example: '------WebKitFormBoundary\nContent-Disposition: form-data; name="file"; filename="avatar.png"\nContent-Type: image/png\n\n[二进制文件内容]\n------WebKitFormBoundary\nContent-Disposition: form-data; name="folder"\n\nimages\n------WebKitFormBoundary--',
    },
    responses: [
      {
        statusCode: 200,
        description: '上传成功',
        schema: [
          { field: 'id', type: 'string', description: '文件ID', required: true },
          { field: 'url', type: 'string', description: '文件访问URL', required: true },
          { field: 'filename', type: 'string', description: '原始文件名', required: true },
          { field: 'size', type: 'number', description: '文件大小（字节）', required: true },
          { field: 'mimeType', type: 'string', description: '文件MIME类型', required: true },
        ],
        examples: [
          {
            statusCode: 200,
            description: '上传成功',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                id: 'file_abc123',
                url: 'https://cdn.example.com/files/abc123.png',
                filename: 'avatar.png',
                size: 204800,
                mimeType: 'image/png',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 413,
        description: '文件过大',
        examples: [
          {
            statusCode: 413,
            description: '超出大小限制',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                error: 'FILE_TOO_LARGE',
                message: '文件大小超过10MB限制',
                maxSize: 10485760,
                actualSize: 15242880,
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  },
]

export const categories = [...new Set(apiEndpoints.map((api) => api.category))]
