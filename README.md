# skland-daily-autosign

森空岛（明日方舟）每日自动签到的最小实现。用鹰角通行证 OAuth token 换取森空岛登录凭证，再对账号下绑定的每个明日方舟角色执行签到，并通过 Windows 计划任务每天自动运行。

> 非官方接口，基于开源库 [`skland-kit`](https://www.npmjs.com/package/skland-kit)。仅用于给自己账号领签到奖励，接口变更或风控可能导致失败。

## 特性

- 手机号 + 短信验证码登录，无需在代码里保存手机号或密码
- token 只落在本机文件，支持限制为仅当前 Windows 用户可读写
- 签到前先查当天记录，已签到直接跳过，重复执行安全
- 日志按日期落盘，失败不会无限重试
- 只领奖励，没有任何消费逻辑

## 环境

- Node.js >= 20.18
- Windows（计划任务部分；脚本本身跨平台）

## 安装

```bash
npm install
```

## 第一次授权（只需一次）

直接跑交互式脚本：

```bash
node login-phone.mjs
```

按提示输入 11 位手机号和收到的短信验证码，成功后 token 写入 `token.txt`。

也可以拆成两步（适合脚本化）：

```bash
node send-code.mjs 13800138000
node verify-code.mjs 13800138000 123456
```

## 手动签到

```bash
node sign.mjs
```

输出示例：

```
[2026/01/01 08:05:01] 签到成功 示例博士#0001(官服)：高级作战记录x2
```

已签到时会输出 `今日已签到`。

## Windows 计划任务

`task.xml.example` 是示例模板，复制为 `task.xml`，把其中的 `DOMAIN\USERNAME` 和路径替换成自己的，然后：

```powershell
schtasks /Create /TN "SklandAutoSign" /XML task.xml /F
schtasks /Run /TN "SklandAutoSign"
```

或者用 PowerShell 直接注册每天 08:05 的任务：

```powershell
$dir = "C:\path\to\skland-daily-autosign"
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$dir\run-sign.cmd`"" -WorkingDirectory $dir
$trigger = New-ScheduledTaskTrigger -Daily -At 08:05
Register-ScheduledTask -TaskName "SklandAutoSign" -Action $action -Trigger $trigger -Force
```

需要电脑开机（不必打开游戏或模拟器）。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `sign.mjs` | 签到主逻辑 |
| `login-phone.mjs` | 交互式手机号登录 |
| `send-code.mjs` / `verify-code.mjs` | 分步登录，便于脚本调用 |
| `run-sign.cmd` | 计划任务入口，带日志重定向 |
| `task.xml.example` | 计划任务 XML 模板 |

## 隐私与安全

- `token.txt`、`logs/` 已加入 `.gitignore`，不要提交或分享。
- token 等同于账号登录凭证，泄露后请尽快在鹰角账号中心修改密码使其失效。
- 脚本不会上传任何数据，所有请求只发往鹰角/森空岛官方域名。

## License

MIT
