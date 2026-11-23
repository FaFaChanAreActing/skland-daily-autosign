import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createClient } from 'skland-kit'

const root = path.dirname(fileURLToPath(import.meta.url))
const tokenFile = path.join(root, 'token.txt')
const client = createClient({ timeout: 20000 })
const rl = readline.createInterface({ input, output })

function save(text) {
  fs.writeFileSync(tokenFile, text, 'utf8')
  try {
    execFileSync('icacls', [tokenFile, '/inheritance:r', '/grant:r', `${process.env.USERNAME}:(R,W)`], { stdio: 'ignore' })
  }
  catch {}
}

try {
  const phone = (await rl.question('鹰角账号手机号（不带 +86，直接 11 位）：')).trim()
  if (!/^1\d{10}$/.test(phone)) {
    console.error('手机号格式不对')
    process.exit(1)
  }
  try {
    await client.collections.hypergryph.sendPhoneCode(phone)
  }
  catch (e) {
    if (!(e && e.cause && e.cause.status === 0 && e.cause.msg === 'OK'))
      throw e
  }
  console.log('验证码已发送，请查看短信。')
  const code = (await rl.question('短信验证码：')).trim()
  const token = await client.collections.hypergryph.getOAuthTokenByPhoneCode({ phone, code })
  save(token)
  console.log('授权成功，token 已保存：' + tokenFile)
}
finally {
  rl.close()
}
