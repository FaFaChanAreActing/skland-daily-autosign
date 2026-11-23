import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from 'skland-kit'

const root = path.dirname(fileURLToPath(import.meta.url))
const tokenFile = path.join(root, 'token.txt')
const logDir = path.join(root, 'logs')
fs.mkdirSync(logDir, { recursive: true })

function log(line) {
  const text = `[${new Date().toLocaleString('zh-CN', { hour12: false })}] ${line}`
  console.log(text)
  const file = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`)
  fs.appendFileSync(file, text + '\n', 'utf8')
}

const token = (process.env.SKLAND_TOKEN || (fs.existsSync(tokenFile) ? fs.readFileSync(tokenFile, 'utf8') : '')).trim()
if (!token) {
  log('未找到 token：请先运行 node login-phone.mjs（手机号+短信验证码）完成一次授权')
  process.exit(2)
}

const client = createClient({ timeout: 30000 })

try {
  const { code } = await client.collections.hypergryph.grantAuthorizeCode(token)
  await client.signIn(code)

  const { list } = await client.collections.player.getBinding()
  const players = list
    .filter(i => i.appCode === 'arknights')
    .flatMap(i => i.bindingList)

  if (!players.length) {
    log('该账号没有绑定明日方舟角色')
    process.exit(0)
  }

  let failed = 0
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
  for (const p of players) {
    const tag = `${p.nickName || p.uid}(${p.channelName || p.channelMasterId})`
    try {
      const status = await client.collections.game.getAttendanceStatus({ uid: p.uid, gameId: p.gameId })
      const signedToday = (status.records || []).some((r) => {
        const d = new Date(Number(r.ts) * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
        return d === today
      })
      if (signedToday) {
        log(`今日已签到 ${tag}`)
        continue
      }
      const awards = await client.collections.game.attendance({ uid: p.uid, gameId: p.gameId })
      const items = (awards.awards || []).map(a => `${a.resource.name}x${a.count}`).join('、')
      log(`签到成功 ${tag}：${items || '已领取'}`)
    }
    catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (/已签到|already|重复/.test(msg)) {
        log(`今日已签到 ${tag}`)
      }
      else {
        failed++
        log(`签到失败 ${tag}：${msg}`)
      }
    }
  }
  process.exit(failed ? 1 : 0)
}
catch (e) {
  log('执行失败：' + (e instanceof Error ? e.message : String(e)))
  process.exit(1)
}
