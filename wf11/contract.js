/**
 * WF11 — API 目录契约数据（独立文件，清晰可替换）。
 *
 * 数据来源说明（TASK_wf11 调研结论，2026-08-31）：
 * - gtsp-wop-gateway 内无正式 OpenAPI/Swagger 契约文件（grep openapi|swagger 仅命中 .factory 工具链的云效端点，与 API 无关）；
 *   接口元数据运行时从平台 DB 加载（ApiInfoCache / ApiVersionDTO，apiFullPath + versionNumber）。
 * - 因此本文件为「示例契约」：接口路径风格对齐网关测试中的真实样例
 *   （GatewayFilterChainHarness: logistics/open-plat/waybill-query；
 *    ForwardFilterTest 后端: /open-plat/waybill/waybill-info-query），
 *   协议头/响应码语义对齐 GatewayConstants 与 GatewayDispatchAppService（业务错误 HTTP 200 + body.code；限流 429；平台内部 500）。
 * - isExample=true 时 UI 必须展示「示例契约，待正式 OpenAPI 替换」横幅；正式契约就绪后整体替换本文件并置 isExample=false。
 *
 * 结构：OpenAPI 3.1 风格 JS 对象（无 YAML 解析器依赖）；WOP 扩展字段以 x-wop- 前缀标注。
 */
(function () {
  'use strict';

  /** 所有出向接口共用的 WOP 协议头（GatewayConstants 实证，x-wop- 前缀防网络设备同名覆盖） */
  var OUT_HEADERS = [
    { name: 'x-wop-appkey', required: true, when: '必传' },
    { name: 'x-wop-sign', required: true, when: '必传（结构化签名头，入签段见「请求构造」页）' },
    { name: 'x-wop-timestamp', required: true, when: '必传（13 位毫秒时间戳，配合 expiredSeconds 防重放）' },
    { name: 'x-wop-nonce', required: true, when: '必传（32 位随机串，5 分钟窗口内不得重复）' },
    { name: 'x-wop-content-digest', required: true, when: '有 body 必传且必入签名（sha-256 族摘要算法标记 + 小写 hex）' },
    { name: 'x-wop-encrypt', required: false, when: 'L2 全文加密时传（L0 缺席）' }
  ];

  /** 入向（平台 → 商户回调）协议头：方向相反，商户侧用 SDK verifyCallback 校验 */
  var CALLBACK_HEADERS = [
    { name: 'x-wop-sign', required: true, when: '平台加签，商户必须验签（SDK verifyCallback）' },
    { name: 'x-wop-timestamp', required: true, when: '平台时间戳' },
    { name: 'x-wop-nonce', required: true, when: '平台随机串（防重放）' },
    { name: 'x-wop-content-digest', required: true, when: '回调 body 摘要，商户必须复核' },
    { name: 'x-wop-encrypt', required: false, when: 'L2 加密回调时传，商户解包 DEK 后解密' }
  ];

  var RESP = {
    ok200: {
      '200': { description: '业务信封（HTTP 200；业务失败也返回 200，以 body.code 区分，SUCCESS 表示成功）' },
      '429': { description: '网关限流（非 200 段；稍后重试）' },
      '500': { description: '平台内部错误（OP_GW_5xxx；异常信封为四字段明文，不签名不加密）' }
    }
  };

  var contract = {
    openapi: '3.1.0',
    /** 示例契约标记：true 时 UI 必须展示显著横幅（自测断言守卫） */
    isExample: true,
    exampleNote: '示例契约（基于 wop-sdk-spec 与网关测试样例构建），待正式 OpenAPI 替换',
    info: {
      title: 'WOP 物流轨迹开放平台 API',
      version: '0.1.0',
      description: '物流轨迹服务开放接口。网关统一 POST 接入：POST {server}/gateway/{apiPath}'
    },
    servers: [
      { url: 'https://gateway.example.com/gtsp-wop-gateway', description: '网关统一入口（context-path 实证为 /gtsp-wop-gateway）' }
    ],
    tags: [
      { name: '运单', description: '运单基础信息查询' },
      { name: '轨迹', description: '物流轨迹查询' },
      { name: '订阅管理', description: '轨迹推送订阅的建立与取消' },
      { name: '回调通知', description: '平台 → 商户方向的推送通知' }
    ],
    paths: {
      '/logistics/open-plat/waybill-query': {
        post: {
          operationId: 'waybillQuery',
          summary: '运单查询',
          description: '按运单号/订单号查询运单基础状态。路径为网关测试样例（GatewayFilterChainHarness）。',
          tags: ['运单'],
          'x-wop-direction': 'merchant-to-platform',
          'x-wop-headers': OUT_HEADERS,
          'x-wop-level': 'L2',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['waybillNo'],
                  properties: {
                    waybillNo: { type: 'string', description: '运单号', example: 'SF-888' },
                    carrierCode: { type: 'string', description: '承运商编码（不确定时可缺省，由平台识别）', example: 'SF' },
                    orderNo: { type: 'string', description: '商户侧订单号（与运单号二选一必填）', example: 'W20260827001' }
                  }
                }
              }
            }
          },
          responses: RESP.ok200
        }
      },

      '/logistics/open-plat/waybill-info-query': {
        post: {
          operationId: 'waybillInfoQuery',
          summary: '运单明细查询',
          description: '查询运单全量明细（含可选的增值明细段）。后端路径样例：/open-plat/waybill/waybill-info-query（ForwardFilterTest）。',
          tags: ['运单'],
          'x-wop-direction': 'merchant-to-platform',
          'x-wop-headers': OUT_HEADERS,
          'x-wop-level': 'L2',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['waybillNo'],
                  properties: {
                    waybillNo: { type: 'string', description: '运单号', example: 'SF-888' },
                    withDetails: { type: 'boolean', description: '是否返回增值明细段', example: 'true' },
                    detailTypes: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '明细段类型筛选（逗号分隔输入）',
                      example: 'PICKUP,TRANSPORT'
                    }
                  }
                }
              }
            }
          },
          responses: RESP.ok200
        }
      },

      '/logistics/open-plat/track/latest': {
        post: {
          operationId: 'trackLatest',
          summary: '最新轨迹查询',
          description: '批量查询运单最新轨迹节点（主动轮询场景；推送场景请用轨迹订阅）。',
          tags: ['轨迹'],
          'x-wop-direction': 'merchant-to-platform',
          'x-wop-headers': OUT_HEADERS,
          'x-wop-level': 'L2',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['waybillNos'],
                  properties: {
                    waybillNos: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 1,
                      maxItems: 50,
                      description: '运单号列表（逗号分隔输入，1~50 个）',
                      example: 'SF-888,SF-889'
                    },
                    language: { type: 'string', description: '轨迹描述语言（缺省 zh-CN）', example: 'zh-CN' }
                  }
                }
              }
            }
          },
          responses: RESP.ok200
        }
      },

      '/logistics/open-plat/track/subscribe': {
        post: {
          operationId: 'trackSubscribe',
          summary: '轨迹订阅',
          description: '订阅运单轨迹推送；轨迹变更时平台按 callback 配置回调商户。表单含嵌套对象（回调配置），用于验证模板化表单的嵌套生成能力。',
          tags: ['订阅管理'],
          'x-wop-direction': 'merchant-to-platform',
          'x-wop-headers': OUT_HEADERS,
          'x-wop-level': 'L2',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['waybillNos', 'callback'],
                  properties: {
                    waybillNos: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 1,
                      description: '运单号列表（逗号分隔输入）',
                      example: 'SF-888'
                    },
                    callback: {
                      type: 'object',
                      description: '回调配置（嵌套对象）',
                      required: ['url'],
                      properties: {
                        url: { type: 'string', description: '回调接收地址（HTTPS）', example: 'https://merchant.example/wop/track-callback' },
                        signAlgorithm: { type: 'string', description: '回调验签算法', example: 'SHA256withRSA' },
                        retryTimes: { type: 'integer', description: '失败重试次数（0~10）', example: '3' }
                      }
                    },
                    expireDays: { type: 'integer', description: '订阅有效期（天，缺省 30）', example: '30' }
                  }
                }
              }
            }
          },
          responses: RESP.ok200
        }
      },

      '/logistics/open-plat/track/unsubscribe': {
        post: {
          operationId: 'trackUnsubscribe',
          summary: '取消轨迹订阅',
          description: '取消已建立的轨迹推送订阅。',
          tags: ['订阅管理'],
          'x-wop-direction': 'merchant-to-platform',
          'x-wop-headers': OUT_HEADERS,
          'x-wop-level': 'L2',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['waybillNos'],
                  properties: {
                    waybillNos: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 1,
                      description: '要取消订阅的运单号列表（逗号分隔输入）',
                      example: 'SF-888'
                    },
                    reason: { type: 'string', description: '取消原因（选填）', example: '订单已完成' }
                  }
                }
              }
            }
          },
          responses: RESP.ok200
        }
      },

      '/logistics/open-plat/callback/track-push': {
        post: {
          operationId: 'trackPushCallback',
          summary: '轨迹推送回调（平台 → 商户）',
          description: '方向与其他接口相反：平台调用商户。商户侧应使用 SDK verifyCallback(headers, body, callbackPath) 验签→digest 复核→解密。商户本地联调可用「请求构造」页模拟构造该报文自测验签逻辑。',
          tags: ['回调通知'],
          'x-wop-direction': 'platform-to-merchant',
          'x-wop-headers': CALLBACK_HEADERS,
          'x-wop-level': 'L2',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['eventId', 'waybillNo', 'events'],
                  properties: {
                    eventId: { type: 'string', description: '推送事件 ID（幂等键）', example: 'evt-20260831-0001' },
                    waybillNo: { type: 'string', description: '运单号', example: 'SF-888' },
                    events: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 1,
                      description: '轨迹事件描述列表（逗号分隔输入；实际推送为结构化事件数组）',
                      example: '已揽收,运输中,已签收'
                    },
                    occurAt: { type: 'string', description: '事件时间（ISO-8601）', example: '2026-08-31T08:30:00+08:00' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: '商户应答（平台按应答判断推送成败并按 retryTimes 重试）' }
          }
        }
      }
    }
  };

  window.WF11_CONTRACT = contract;
})();
