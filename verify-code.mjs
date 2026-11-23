import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createClient } from 'skland-kit'

const root = path.dirname(fileURLToPath(import.meta.url))
const tokenFile = path.join(root, 'token.txt')
const phone = process.argv[2]
const code = process.argv[3]

if (!/^1\d{10}$/.test(phone || '') || !/^\d{4,8}$/.test(code || '')) {
  console.error('用法: node verify-code.mjs 手机号 验证码')
  process.exit(1)
}

const client = createClient({ timeout: 20000 })
const token = await client.collections.hypergryph.getOAuthTokenByPhoneCode({ phone, code })
fs.writeFileSync(tokenFile, token, 'utf8')
try {
  execFileSync('icacls', [tokenFile, '/inheritance:r', '/grant:r', `${process.env.USERNAME}:(R,W)`], { stdio: 'ignore' })
}
catch {}
console.log('授权成功，token 已保存')
