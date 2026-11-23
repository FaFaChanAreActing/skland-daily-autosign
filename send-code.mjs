import { createClient } from 'skland-kit'

const phone = process.argv[2]
if (!/^1\d{10}$/.test(phone || '')) {
  console.error('用法: node send-code.mjs 11位手机号')
  process.exit(1)
}
const client = createClient({ timeout: 20000 })
try {
  await client.collections.hypergryph.sendPhoneCode(phone)
}
catch (e) {
  // 接口成功但无 data 时库会误判为失败，status 0 / OK 视为已发送
  if (!(e && e.cause && e.cause.status === 0 && e.cause.msg === 'OK'))
    throw e
}
console.log('验证码已发送')
