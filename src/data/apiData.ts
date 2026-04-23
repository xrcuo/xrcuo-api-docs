import type { ApiEndpoint } from '@/types/api'

export const apiEndpoints: ApiEndpoint[] = [
  {
    id: 'ip-query',
    name: 'IP 地区查询',
    path: '/api/ip',
    method: 'GET',
    description: '查询指定 IP 地址的地理位置、运营商等信息。支持 IPv4 地址查询。',
    category: 'IP 查询',
    tags: ['IP', '地区', '运营商'],
    parameters: [
      {
        name: 'ip',
        type: 'string',
        required: true,
        description: '要查询的 IP 地址（IPv4）',
        example: '114.114.114.114',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: '查询成功',
        schema: [
          { field: 'code', type: 'number', description: '状态码（200 成功）', required: true },
          { field: 'msg', type: 'string', description: '提示信息', required: true },
          { field: 'data', type: 'object', description: '查询结果数据', required: true },
          { field: 'data.ip', type: 'string', description: '查询的 IP 地址', required: true },
          { field: 'data.location', type: 'string', description: '地理位置（国家+省份+城市）', required: true },
          { field: 'data.isp', type: 'string', description: '运营商', required: true },
          { field: 'data.area', type: 'string', description: '完整信息（国家+省份+城市+运营商）', required: true },
          { field: 'took', type: 'string', description: '总耗时', required: true },
        ],
        examples: [
          {
            statusCode: 200,
            description: '成功响应示例',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 200,
                msg: '请求成功',
                data: {
                  ip: '114.114.114.114',
                  location: '中国 江苏 南京',
                  isp: '中国电信',
                  area: '中国 江苏 南京 中国电信',
                },
                took: '15.234ms',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 400,
        description: '参数错误',
        examples: [
          {
            statusCode: 400,
            description: 'IP 地址为空或格式无效',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 400,
                msg: '参数错误：无效的IP地址格式',
                data: null,
                took: '0.512ms',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 500,
        description: '服务器内部错误',
        examples: [
          {
            statusCode: 500,
            description: '查询服务异常',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 500,
                msg: '查询失败：数据库连接异常',
                data: null,
                took: '2.341ms',
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
    id: 'ipify',
    name: '获取访问者 IP',
    path: '/api/ipify',
    method: 'GET',
    description: '获取当前访问者的真实 IP 地址。支持通过 X-Real-IP、X-Forwarded-For 头获取代理后的真实 IP。',
    category: 'IP 查询',
    tags: ['IP', '访问者'],
    headers: [
      {
        name: 'X-Real-IP',
        required: false,
        description: '代理服务器转发的真实客户端 IP',
        example: '203.0.113.1',
      },
      {
        name: 'X-Forwarded-For',
        required: false,
        description: '代理链路上的客户端 IP 列表',
        example: '203.0.113.1, 10.0.0.1',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: '成功返回 IP 地址',
        examples: [
          {
            statusCode: 200,
            description: '纯文本 IP 地址',
            contentType: 'text/plain',
            body: '203.0.113.45',
          },
        ],
      },
    ],
  },
  {
    id: 'ping',
    name: 'Ping 网络测试',
    path: '/api/ping',
    method: 'GET',
    description: '对指定目标执行 ICMP Ping 测试，返回延迟、丢包率等网络质量指标。支持域名和 IP 地址。Windows 下需要管理员权限。',
    category: '网络工具',
    tags: ['Ping', '网络', '延迟'],
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: '目标地址（域名或 IP）',
        example: 'www.baidu.com',
      },
      {
        name: 'timeout',
        type: 'integer',
        required: false,
        description: '超时时间（秒），范围 1-10，默认 3',
        defaultValue: '3',
        example: '5',
      },
      {
        name: 'count',
        type: 'integer',
        required: false,
        description: 'Ping 包数，范围 1-10，默认 4',
        defaultValue: '4',
        example: '4',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: 'Ping 测试成功',
        schema: [
          { field: 'code', type: 'number', description: '状态码', required: true },
          { field: 'msg', type: 'string', description: '提示信息', required: true },
          { field: 'data', type: 'object', description: 'Ping 结果数据', required: true },
          { field: 'data.target', type: 'string', description: '目标地址', required: true },
          { field: 'data.ip', type: 'string', description: '解析后的 IP', required: true },
          { field: 'data.delay', type: 'string', description: '平均延迟', required: true },
          { field: 'data.location', type: 'string', description: '地区信息', required: true },
          { field: 'data.isp', type: 'string', description: '运营商', required: true },
          { field: 'data.area', type: 'string', description: '完整地区信息', required: true },
          { field: 'data.ping_stats', type: 'object', description: '详细统计', required: true },
          { field: 'data.ping_stats.sent', type: 'number', description: '发送包数', required: true },
          { field: 'data.ping_stats.received', type: 'number', description: '接收包数', required: true },
          { field: 'data.ping_stats.lost', type: 'number', description: '丢失包数', required: true },
          { field: 'data.ping_stats.lost_rate', type: 'number', description: '丢包率（%）', required: true },
          { field: 'data.ping_stats.min_delay', type: 'string', description: '最小延迟', required: true },
          { field: 'data.ping_stats.avg_delay', type: 'string', description: '平均延迟', required: true },
          { field: 'data.ping_stats.max_delay', type: 'string', description: '最大延迟', required: true },
          { field: 'data.ping_stats.std_dev', type: 'string', description: '标准差', required: true },
          { field: 'took', type: 'string', description: '总耗时', required: true },
        ],
        examples: [
          {
            statusCode: 200,
            description: '成功响应示例',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 200,
                msg: '请求成功',
                data: {
                  target: 'www.baidu.com',
                  ip: '14.215.177.38',
                  delay: '28.45ms',
                  location: '中国 广东 广州',
                  isp: '中国电信',
                  area: '中国 广东 广州 中国电信',
                  ping_stats: {
                    sent: 4,
                    received: 4,
                    lost: 0,
                    lost_rate: 0,
                    min_delay: '25.12ms',
                    avg_delay: '28.45ms',
                    max_delay: '32.78ms',
                    std_dev: '2.89ms',
                  },
                },
                took: '1.234s',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 400,
        description: '参数错误或目标解析失败',
        examples: [
          {
            statusCode: 400,
            description: '参数校验失败',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 400,
                msg: '参数错误：超时时间必须是1-10秒',
                data: null,
                took: '0.234ms',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 500,
        description: 'Ping 执行失败或超时',
        examples: [
          {
            statusCode: 500,
            description: '目标不可达',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 500,
                msg: 'Ping超时',
                data: null,
                took: '3.012s',
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
    id: 'client-info',
    name: '获取客户端信息',
    path: '/api/client',
    method: 'GET',
    description: '获取当前访问者的客户端信息，包括 IP 地址、地理位置、操作系统、浏览器及版本。自动从 User-Agent 解析系统与浏览器信息。',
    category: '客户端信息',
    tags: ['客户端', 'User-Agent', 'IP'],
    headers: [
      {
        name: 'User-Agent',
        required: false,
        description: '浏览器 User-Agent 字符串，用于解析操作系统和浏览器信息',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        name: 'X-Real-IP',
        required: false,
        description: '代理服务器转发的真实客户端 IP',
        example: '203.0.113.1',
      },
      {
        name: 'X-Forwarded-For',
        required: false,
        description: '代理链路上的客户端 IP 列表',
        example: '203.0.113.1, 10.0.0.1',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: '成功获取客户端信息',
        schema: [
          { field: 'code', type: 'number', description: '状态码', required: true },
          { field: 'msg', type: 'string', description: '提示信息', required: true },
          { field: 'data', type: 'object', description: '客户端信息数据', required: true },
          { field: 'data.ip', type: 'string', description: '客户端 IP 地址', required: true },
          { field: 'data.location', type: 'string', description: '地理位置', required: true },
          { field: 'data.isp', type: 'string', description: '运营商', required: true },
          { field: 'data.area', type: 'string', description: '完整地区信息', required: true },
          { field: 'data.os', type: 'string', description: '操作系统', required: true },
          { field: 'data.browser', type: 'string', description: '浏览器名称', required: true },
          { field: 'data.browser_version', type: 'string', description: '浏览器版本', required: true },
          { field: 'took', type: 'string', description: '总耗时', required: true },
        ],
        examples: [
          {
            statusCode: 200,
            description: '成功响应示例',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 200,
                msg: '请求成功',
                data: {
                  ip: '192.168.1.100',
                  location: '中国 北京',
                  isp: '中国联通',
                  area: '中国 北京 中国联通',
                  os: 'Windows 10',
                  browser: 'Google Chrome',
                  browser_version: '120.0.0.0',
                },
                took: '12.456ms',
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
    id: 'mcpe-status',
    name: 'MCPE 服务器状态查询',
    path: '/api/mcpe/status',
    method: 'GET',
    description: '查询 Minecraft PE（基岩版）服务器的状态信息，包括在线人数、版本、MOTD 等。通过 UDP 协议查询服务器。',
    category: '游戏查询',
    tags: ['Minecraft', 'MCPE', '游戏服务器'],
    parameters: [
      {
        name: 'server',
        type: 'string',
        required: true,
        description: 'MCPE 服务器地址（域名或 IP）',
        example: 'play.example.com',
      },
      {
        name: 'port',
        type: 'integer',
        required: false,
        description: '服务器端口，范围 1-65535，默认 19132',
        defaultValue: '19132',
        example: '19132',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: '查询成功',
        schema: [
          { field: 'code', type: 'number', description: '状态码', required: true },
          { field: 'msg', type: 'string', description: '提示信息', required: true },
          { field: 'data', type: 'object', description: '服务器状态数据', required: true },
          { field: 'data.server_ip', type: 'string', description: '服务器地址', required: true },
          { field: 'data.port', type: 'number', description: '服务器端口', required: true },
          { field: 'data.online', type: 'number', description: '当前在线人数', required: true },
          { field: 'data.max_players', type: 'number', description: '最大玩家数', required: true },
          { field: 'data.version', type: 'string', description: '服务器版本', required: true },
          { field: 'data.motd', type: 'string', description: '服务器描述', required: true },
          { field: 'data.ping_time', type: 'string', description: '延迟', required: true },
          { field: 'data.time', type: 'string', description: '查询时间（ISO 8601）', required: true },
          { field: 'took', type: 'string', description: '总耗时', required: true },
        ],
        examples: [
          {
            statusCode: 200,
            description: '成功响应示例',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 200,
                msg: '请求成功',
                data: {
                  server_ip: 'play.example.com',
                  port: 19132,
                  online: 42,
                  max_players: 100,
                  version: '1.20.50',
                  motd: 'Welcome to My Server',
                  ping_time: '45ms',
                  time: '2024-06-20T14:30:00+08:00',
                },
                took: '156ms',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 400,
        description: '参数错误',
        examples: [
          {
            statusCode: 400,
            description: '端口非法',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 400,
                msg: '参数错误：端口必须是1-65535之间的整数',
                data: null,
                took: '0.312ms',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 500,
        description: '查询失败',
        examples: [
          {
            statusCode: 500,
            description: '服务器无响应',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 500,
                msg: 'MCPE服务器查询失败：接收响应失败：read udp timeout',
                data: null,
                took: '5.012s',
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
    id: 'random-image',
    name: '随机图片',
    path: '/api/randomimage',
    method: 'GET',
    description: '从服务器 images 目录中随机返回一张图片。支持 jpg、jpeg、png、gif、webp、bmp 格式。',
    category: '工具',
    tags: ['图片', '随机'],
    responses: [
      {
        statusCode: 200,
        description: '成功返回图片',
        examples: [
          {
            statusCode: 200,
            description: '图片二进制数据',
            contentType: 'image/jpeg',
            body: '[二进制图片数据]',
          },
        ],
      },
      {
        statusCode: 404,
        description: '未找到图片',
        examples: [
          {
            statusCode: 404,
            description: '图片目录为空或不存在',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 404,
                msg: '未找到图片',
                took: '0.512ms',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 500,
        description: '服务器内部错误',
        examples: [
          {
            statusCode: 500,
            description: '扫描目录失败',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                code: 500,
                msg: '扫描图片目录失败',
                took: '1.234ms',
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
    id: 'stats',
    name: '服务统计页面',
    path: '/stats',
    method: 'GET',
    description: '返回服务访问统计的 HTML 页面，展示请求量、响应时间等统计信息。',
    category: '统计',
    tags: ['统计', '监控'],
    responses: [
      {
        statusCode: 200,
        description: '成功返回统计页面',
        examples: [
          {
            statusCode: 200,
            description: 'HTML 页面',
            contentType: 'text/html',
            body: '<!DOCTYPE html>...',
          },
        ],
      },
    ],
  },
  {
    id: 'stats-api',
    name: '服务统计 API',
    path: '/api/stats',
    method: 'GET',
    description: '返回服务访问统计的 JSON 数据，包含请求次数、平均响应时间、各接口调用次数等。',
    category: '统计',
    tags: ['统计', 'API', 'JSON'],
    responses: [
      {
        statusCode: 200,
        description: '成功返回统计数据',
        examples: [
          {
            statusCode: 200,
            description: '统计 JSON 数据',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                total_requests: 12580,
                avg_response_time: '23.5ms',
                api_calls: {
                  '/api/ip': 3420,
                  '/api/ping': 2180,
                  '/api/client': 1560,
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
    id: 'yiyan',
    name: '一言',
    path: '/api/yiyan',
    method: 'GET',
    description: '返回一句随机的中文名言/诗句。代理自 https://api.kekc.cn/api/yien，失败时返回默认诗句。',
    category: '工具',
    tags: ['一言', '诗词', '随机'],
    responses: [
      {
        statusCode: 200,
        description: '成功返回一言',
        examples: [
          {
            statusCode: 200,
            description: '一言 JSON 数据',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                cn: '人生若只如初见，何事秋风悲画扇。',
              },
              null,
              2,
            ),
          },
        ],
      },
      {
        statusCode: 500,
        description: '代理请求失败时返回默认诗句',
        examples: [
          {
            statusCode: 500,
            description: '默认诗句',
            contentType: 'application/json',
            body: JSON.stringify(
              {
                cn: '人生若只如初见，何事秋风悲画扇。',
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
