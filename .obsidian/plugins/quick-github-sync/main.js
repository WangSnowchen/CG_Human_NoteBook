const { Plugin, Notice, PluginSettingTab, Setting } = require('obsidian');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const LOG = '[Quick GitHub Sync]';
const VERSION = '1.1.1';

const DEFAULT_SETTINGS = {
    repoUrl: '',
    branch: 'main',
    remote: 'origin',
    userName: '',
    userEmail: '',
    commitNoteEnabled: true,
    commitNotePath: '提交记录.md',
    requireCommitBody: true,
    statusRefreshMinutes: 5,
    gitPath: '',
};

const TOKEN_KEY = 'quick-github-sync:token';
const TOKEN_ENV = 'OBSIDIAN_GIT_TOKEN';

// token 只通过环境变量交给 git，绝不进 argv（argv 在 ps 里对同机所有用户可见）
const CRED_HELPER = '!f() { echo username=x-access-token; echo password="$OBSIDIAN_GIT_TOKEN"; }; f';

const AUTO_GITIGNORE = [
    '# Quick GitHub Sync 自动生成',
    '.obsidian/workspace.json',
    '.obsidian/workspace-mobile.json',
    '.DS_Store',
    '.trash/',
    '',
].join('\n');

const NET_TIMEOUT_MS = 90000;
const LOCAL_TIMEOUT_MS = 20000;

// ---- 提交记录文件 ----
// 用一个 md 文档来写「这次提交了什么」：待填区手写，历史区由插件自动追加。
const NOTE_PENDING_START = '<!-- QGS:PENDING:START -->';
const NOTE_PENDING_END = '<!-- QGS:PENDING:END -->';
const NOTE_HISTORY_HEADING = '## 历史';
const NOTE_TITLE_KEYS = ['标题', 'Title', 'title'];
const NOTE_BODY_KEYS = ['说明', '描述', 'Message', 'message', 'Body', 'body'];

const noteTemplate = () =>
    [
        '# 提交记录',
        '',
        '<!-- 同步之前，把这次的「标题」和「说明」写在下面（冒号后面直接写，同一行即可）。',
        '     「标题」会成为 commit 标题，「说明」会成为 commit 正文。',
        '     如果标题还空着就点同步，插件只会提醒你先写好，不会提交任何东西。 -->',
        '',
        NOTE_PENDING_START,
        '标题：',
        '说明：',
        NOTE_PENDING_END,
        '',
        '---',
        '',
        NOTE_HISTORY_HEADING,
        '',
        '<!-- 下面是每次同步后自动追加的记录，不用手写 -->',
        '',
    ].join('\n');

const pad = (n) => String(n).padStart(2, '0');
const clock = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const stamp = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const logInfo = (...a) => console.log(LOG, ...a);
const logWarn = (...a) => console.warn(LOG, ...a);
const logError = (...a) => console.error(LOG, ...a);

class QuickGitHubSyncPlugin extends Plugin {
    busy = false;
    testing = false;
    statusEl = null;
    timer = null;
    settingTab = null;
    identityProbe = null;

    status = {
        state: 'unconfigured',
        behind: 0,
        ahead: 0,
        dirty: 0,
        lastSync: null,
        checkedAt: null,
        message: '',
    };

    async onload() {
        await this.loadSettings();
        logInfo(`本地增强版 ${VERSION} 已加载`);
        logInfo('仓库:', this.settings.repoUrl || '(未配置)');
        logInfo('Token:', this.getToken() ? '已保存' : '(未配置)');
        logInfo('分支:', this.branch(), '| remote:', this.remote());

        // 关键：把设置页注册进去，否则「设置 → 第三方插件」里根本找不到本插件，
        // 仓库地址和 Token 就没有任何地方可以填写。
        this.settingTab = new QuickGitHubSyncSettingTab(this.app, this);
        this.addSettingTab(this.settingTab);

        this.statusEl = this.addStatusBarItem();
        this.statusEl.addClass('quick-github-sync-status');
        this.statusEl.addEventListener('click', () => {
            // 未配置时点状态栏直接跳到设置页，而不是弹一句「请先配置」然后没下文
            if (!this.isConfigured()) this.openSettings();
            else if (this.status.state === 'need-note') this.openCommitNote();
            else this.refreshStatus({ announce: true });
        });
        this.renderStatus();

        this.addRibbonIcon('cloud-upload', 'Sync vault with GitHub', () => this.sync());

        this.addCommand({
            id: 'sync',
            name: 'Sync vault with GitHub',
            callback: () => this.sync(),
        });
        this.addCommand({
            id: 'check-remote-status',
            name: '检查远端仓库状态',
            callback: () => this.refreshStatus({ announce: true }),
        });
        this.addCommand({
            id: 'open-settings',
            name: '打开设置（仓库地址 / Token）',
            callback: () => this.openSettings(),
        });
        this.addCommand({
            id: 'open-commit-note',
            name: '打开提交记录（写这次提交了什么）',
            callback: () => this.openCommitNote(),
        });

        this.announceVersion();

        this.app.workspace.onLayoutReady(() => {
            this.refreshStatus();
            this.restartTimer();
        });
    }

    // 改完 main.js 必须重载插件才会生效；重载成功时弹一次提示，
    // 免得出现「改了代码但跑的还是旧版本」这种看不出所以然的问题。
    announceVersion() {
        const KEY = 'quick-github-sync:last-version';
        let last = '';
        try {
            last = window.localStorage.getItem(KEY) || '';
        } catch (_) {
            /* 忽略 */
        }
        if (last === VERSION) return;
        try {
            window.localStorage.setItem(KEY, VERSION);
        } catch (_) {
            /* 忽略 */
        }
        new Notice(`Quick GitHub Sync 已加载 ${VERSION}`, 5000);
    }

    onunload() {
        if (this.timer) clearInterval(this.timer);
        logInfo('插件已卸载');
    }

    // ---------- 设置 ----------

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.restartTimer();
        this.renderStatus();
    }

    isConfigured() {
        return !!((this.settings.repoUrl || '').trim() && this.getToken());
    }

    // Token 存在本机（localStorage）而不是 data.json，因为 .obsidian/plugins/**/data.json
    // 会跟着仓库一起提交，写进去等于把 PAT 公开到 GitHub 上。
    // Obsidian 1.13 起 app.loadLocalStorage 已废弃，所以两条路都试一遍。
    getToken() {
        try {
            if (this.app && typeof this.app.loadLocalStorage === 'function') {
                const v = this.app.loadLocalStorage(TOKEN_KEY);
                if (v) return String(v).trim();
            }
        } catch (e) {
            logWarn('loadLocalStorage 不可用，改用 window.localStorage: ' + e.message);
        }
        try {
            const v = window.localStorage.getItem(TOKEN_KEY);
            if (v) return String(v).trim();
        } catch (e) {
            logError('读取 localStorage 失败: ' + e.message);
        }
        return '';
    }

    setToken(value) {
        const v = String(value == null ? '' : value).trim();
        let saved = false;

        try {
            if (this.app && typeof this.app.saveLocalStorage === 'function') {
                this.app.saveLocalStorage(TOKEN_KEY, v);
                saved = true;
            }
        } catch (e) {
            logWarn('saveLocalStorage 不可用，改用 window.localStorage: ' + e.message);
        }

        try {
            window.localStorage.setItem(TOKEN_KEY, v);
            saved = true;
        } catch (e) {
            logError('写入 localStorage 失败: ' + e.message);
        }

        if (!saved) new Notice('Quick GitHub Sync: Token 保存失败，请看控制台日志');
        this.renderStatus();
    }

    // 直接跳到本插件的设置页，省得用户自己在一堆插件里翻
    openSettings() {
        const setting = this.app && this.app.setting;
        if (setting && typeof setting.openTabById === 'function') {
            try {
                setting.openTabById(this.manifest.id);
                return true;
            } catch (e) {
                logWarn('openTabById 失败: ' + e.message);
            }
        }
        new Notice('Quick GitHub Sync: 请打开 设置 → 第三方插件 → Quick GitHub Sync');
        return false;
    }

    branch() {
        return (this.settings.branch || '').trim() || 'main';
    }

    remote() {
        return (this.settings.remote || '').trim() || 'origin';
    }

    vaultPath() {
        return this.app.vault.adapter.basePath;
    }

    restartTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        const mins = Number(this.settings.statusRefreshMinutes) || 0;
        if (mins <= 0) {
            logInfo('自动状态检查已关闭');
            return;
        }
        this.timer = setInterval(() => this.refreshStatus(), mins * 60 * 1000);
        logInfo(`自动状态检查间隔: ${mins} 分钟（只 fetch，不提交不上传）`);
    }

    // ---------- git 调用 ----------

    redact(text) {
        const token = this.getToken();
        let out = String(text == null ? '' : text);
        if (token) out = out.split(token).join('***');
        return out.trim();
    }

    run(args, opts) {
        opts = opts || {};
        const timeout = opts.timeout || LOCAL_TIMEOUT_MS;
        const token = this.getToken();
        const env = Object.assign({}, process.env);
        const finalArgs = [];

        if (opts.auth && token) {
            finalArgs.push('-c', 'credential.helper=', '-c', 'credential.helper=' + CRED_HELPER);
            env[TOKEN_ENV] = token;
            env.GIT_TERMINAL_PROMPT = '0';
        }
        finalArgs.push.apply(finalArgs, args);

        const shown = finalArgs
            .map((a) => (a === CRED_HELPER ? '"<credential-helper>"' : a))
            .join(' ');
        logInfo('$ git ' + shown);

        return new Promise((resolve, reject) => {
            execFile(
                this.settings.gitPath || 'git',
                finalArgs,
                {
                    env,
                    cwd: opts.cwd,
                    timeout,
                    killSignal: 'SIGTERM',
                    maxBuffer: 16 * 1024 * 1024,
                    windowsHide: true,
                },
                (err, stdout, stderr) => {
                    const out = String(stdout || '');
                    const errOut = String(stderr || '');

                    if (err) {
                        let msg;
                        if (err.killed || err.signal === 'SIGTERM') {
                            msg = `git 命令超时（${Math.round(timeout / 1000)} 秒）`;
                        } else {
                            msg = this.redact(errOut || err.message);
                        }
                        // 探测类调用（判断分支是否存在之类）返回非零属于正常情况，别刷 ERROR
                        if (opts.quiet) logInfo('git 探测返回非零（预期内）: ' + msg.split('\n')[0]);
                        else logError('git 失败: ' + msg);
                        const e = new Error(msg);
                        e.stderr = errOut;
                        reject(e);
                        return;
                    }
                    if (errOut.trim()) logWarn('git 提示: ' + this.redact(errOut.trim()));
                    resolve(out.trim());
                }
            );
        });
    }

    async refExists(vault, ref) {
        try {
            await this.run(['-C', vault, 'rev-parse', '--verify', '--quiet', ref], { quiet: true });
            return true;
        } catch (_) {
            return false;
        }
    }

    async count(vault, range) {
        try {
            const out = await this.run(['-C', vault, 'rev-list', '--count', range], { quiet: true });
            return parseInt(out, 10) || 0;
        } catch (_) {
            return 0;
        }
    }

    async dirtyCount(vault) {
        try {
            const out = await this.run(['-C', vault, 'status', '--porcelain'], { quiet: true });
            return out ? out.split('\n').filter((l) => l.trim()).length : 0;
        } catch (_) {
            return 0;
        }
    }

    // ---------- 仓库准备 ----------

    async ensureRepo(vault) {
        let root = null;
        try {
            root = await this.run(['-C', vault, 'rev-parse', '--show-toplevel']);
        } catch (_) {
            root = null;
        }

        if (root && path.resolve(root) !== path.resolve(vault)) {
            throw new Error(
                `vault 位于另一个 git 仓库内（${root}），为避免误提交已中止。\n` +
                    '请把 vault 移出那个仓库，或删掉上层的 .git。'
            );
        }

        if (!root) {
            logInfo('vault 不是 git 仓库，自动初始化');
            await this.run(['-C', vault, 'init']);
            const b = this.branch();
            try {
                await this.run(['-C', vault, 'symbolic-ref', 'HEAD', 'refs/heads/' + b]);
            } catch (e) {
                logWarn('设置初始分支失败（可忽略）: ' + e.message);
            }
            const gi = path.join(vault, '.gitignore');
            if (!fs.existsSync(gi)) {
                fs.writeFileSync(gi, AUTO_GITIGNORE, 'utf8');
                logInfo('已创建 .gitignore（排除 workspace.json 等易变文件）');
            }
        }

        await this.ensureNoteMergeDriver(vault);
        await this.ensureIdentity(vault);
        await this.ensureRemote(vault);
    }

    // 读某个 git 身份字段的「当前生效值」（仓库级 → 全局 → 系统，git 自己会挑）
    async gitIdentityValue(vault, key) {
        try {
            const out = await this.run(['-C', vault, 'config', '--get', key], { quiet: true });
            return (out || '').trim();
        } catch (_) {
            return '';
        }
    }

    // 返回 { name, email }：当前实际会用于 commit 的身份，供设置页做占位提示
    async currentIdentity() {
        const vault = this.vaultPath();
        const id = {
            name: await this.gitIdentityValue(vault, 'user.name'),
            email: await this.gitIdentityValue(vault, 'user.email'),
        };
        this.identityProbe = id;
        return id;
    }

    // 把设置页里填的名字/邮箱写进仓库级 git config，返回仍然缺失的字段
    async applyIdentity(vault) {
        const wanted = [
            ['user.name', (this.settings.userName || '').trim()],
            ['user.email', (this.settings.userEmail || '').trim()],
        ];
        const missing = [];

        for (const [key, want] of wanted) {
            let current = await this.gitIdentityValue(vault, key);

            if (want && current !== want) {
                try {
                    await this.run(['-C', vault, 'config', key, want]);
                    logInfo(`已写入仓库级 ${key} = ${want}`);
                    current = want;
                } catch (e) {
                    logWarn(`写入 ${key} 失败: ` + e.message);
                }
            }
            if (!current) missing.push(key);
        }
        return missing;
    }

    // 设置页里改完名字/邮箱就直接落盘到仓库级 git config，不必等到点同步
    async pushIdentityToGit() {
        try {
            const missing = await this.applyIdentity(this.vaultPath());
            await this.currentIdentity();
            return missing;
        } catch (e) {
            logWarn('写入提交者身份失败: ' + e.message);
            return null;
        }
    }

    async ensureIdentity(vault) {
        const missing = await this.applyIdentity(vault);
        if (!missing.length) return;

        const label = {
            'user.name': '提交者名字（user.name）',
            'user.email': '提交者邮箱（user.email）',
        };
        throw new Error(
            `还缺 ${missing.map((k) => label[k] || k).join(' / ')}，git 不知道该以谁的名义提交。\n\n` +
                '推荐：在 设置 → 第三方插件 → Quick GitHub Sync 里填写「提交者名字」和「提交者邮箱」，' +
                '插件会自动写进本仓库的 git 配置。\n\n' +
                '或者在终端里配一次全局身份：\n' +
                '  git config --global user.name "你的名字"\n' +
                '  git config --global user.email "你的邮箱"'
        );
    }

    async ensureRemote(vault) {
        const name = this.remote();
        const url = (this.settings.repoUrl || '').trim();
        let current = null;
        try {
            current = await this.run(['-C', vault, 'remote', 'get-url', name], { quiet: true });
        } catch (_) {
            current = null;
        }

        if (current === null) {
            await this.run(['-C', vault, 'remote', 'add', name, url]);
            logInfo(`已添加 remote ${name} -> ${url}`);
        } else if (current.trim() !== url) {
            await this.run(['-C', vault, 'remote', 'set-url', name, url]);
            logInfo(`已更新 remote ${name} -> ${url}`);
        }

        // 保证 fetch 能顺带更新 origin/<branch>，状态检查才有依据
        try {
            await this.run([
                '-C',
                vault,
                'config',
                `remote.${name}.fetch`,
                `+refs/heads/*:refs/remotes/${name}/*`,
            ]);
        } catch (_) {
            /* 忽略 */
        }
    }

    async fetchRemote(vault) {
        const name = this.remote();
        try {
            await this.run(['-C', vault, 'fetch', name, '--prune'], {
                auth: true,
                timeout: NET_TIMEOUT_MS,
            });
        } catch (e) {
            const msg = e.message || '';
            if (!/couldn't find remote ref|empty repository|Could not read from remote/i.test(msg)) {
                throw e;
            }
            logWarn('远端还是空仓库，跳过拉取');
            return { empty: true };
        }
        const has = await this.refExists(vault, `refs/remotes/${name}/${this.branch()}`);
        return { empty: !has };
    }

    async aheadBehind(vault) {
        const name = this.remote();
        const ref = `refs/remotes/${name}/${this.branch()}`;
        const hasRemote = await this.refExists(vault, ref);
        const hasHead = await this.refExists(vault, 'HEAD');
        if (!hasRemote) {
            return { behind: 0, ahead: hasHead ? await this.count(vault, 'HEAD') : 0, remoteEmpty: true };
        }
        return {
            behind: await this.count(vault, `HEAD..${ref}`),
            ahead: await this.count(vault, `${ref}..HEAD`),
            remoteEmpty: false,
        };
    }

    // 不依赖本地仓库，直接问远端：用来单独验证「仓库地址 + Token」是否可用
    async testConnection() {
        const url = (this.settings.repoUrl || '').trim();
        if (!url) {
            new Notice('Quick GitHub Sync: 请先填写仓库地址');
            return false;
        }
        if (!this.getToken()) {
            new Notice('Quick GitHub Sync: 请先填写 Personal Access Token');
            return false;
        }
        if (this.testing) return false;

        this.testing = true;
        new Notice('Quick GitHub Sync: 正在测试连接…');
        try {
            const out = await this.run(['ls-remote', '--heads', url, this.branch()], {
                auth: true,
                timeout: NET_TIMEOUT_MS,
            });
            if (out.split('\n').some((l) => l.trim())) {
                logInfo('连接测试成功');
                new Notice('Quick GitHub Sync: 连接成功，仓库和 Token 都可用 ✓');
                return true;
            }
            logInfo('连接测试成功，但远端还没有该分支');
            new Notice(
                `Quick GitHub Sync: 能连上，但远端还没有 ${this.branch()} 分支（首次同步会自动创建）`
            );
            return true;
        } catch (e) {
            logError('连接测试失败: ' + e.message);
            new Notice('Quick GitHub Sync: 连接失败\n' + e.message, 12000);
            return false;
        } finally {
            this.testing = false;
        }
    }

    // ---------- 提交记录文件 ----------

    commitNotePath() {
        const fallback = DEFAULT_SETTINGS.commitNotePath;
        const raw = (this.settings.commitNotePath || '').trim() || fallback;
        const clean = raw.replace(/^[./\\]+/, '').replace(/\\/g, '/');
        if (!clean || clean.split('/').includes('..')) return fallback;
        return clean;
    }

    noteAbsPath() {
        return path.join(this.vaultPath(), this.commitNotePath());
    }

    // 从文件内容里解析出这次要用的标题 / 说明
    parseCommitNote(text) {
        const s = text.indexOf(NOTE_PENDING_START);
        const e = text.indexOf(NOTE_PENDING_END);
        const hasMarkers = s !== -1 && e > s;
        const pending = hasMarkers ? text.slice(s + NOTE_PENDING_START.length, e) : '';

        let title = '';
        let body = '';
        let inBody = false;

        for (const raw of pending.split('\n')) {
            const line = raw.trim();
            if (!line) {
                inBody = false;
                continue;
            }
            const tk = NOTE_TITLE_KEYS.find((k) => line.startsWith(k + '：') || line.startsWith(k + ':'));
            if (tk) {
                title = line.slice(tk.length + 1).trim();
                inBody = false;
                continue;
            }
            const bk = NOTE_BODY_KEYS.find((k) => line.startsWith(k + '：') || line.startsWith(k + ':'));
            if (bk) {
                body = line.slice(bk.length + 1).trim();
                inBody = true;
                continue;
            }
            // 说明写了好几行时，后续行也算正文
            if (inBody) body = body ? body + '\n' + line : line;
        }

        return { title, body, hasMarkers, pending };
    }

    // createIfMissing=true 时，文件不存在就按模板建一个（首次同步会用上）
    readCommitNote(createIfMissing) {
        const abs = this.noteAbsPath();
        const empty = { title: '', body: '', hasMarkers: false, pending: '', text: '', ok: false, error: '' };

        try {
            if (!fs.existsSync(abs)) {
                if (!createIfMissing) return empty;
                fs.mkdirSync(path.dirname(abs), { recursive: true });
                fs.writeFileSync(abs, noteTemplate(), 'utf8');
                logInfo(`已创建提交记录文件: ${this.commitNotePath()}`);
            }
            const text = fs.readFileSync(abs, 'utf8');
            return Object.assign(this.parseCommitNote(text), { text, ok: true, error: '' });
        } catch (e) {
            logError('读取提交记录失败: ' + e.message);
            return Object.assign(empty, { error: e.message });
        }
    }

    // 返回空字符串表示没问题，否则是给用户看的原因
    validateCommitNote(note) {
        if (!this.settings.commitNoteEnabled) return '';
        if (!note || !note.ok) return '读不到提交记录文件' + (note && note.error ? `：${note.error}` : '');
        if (!note.hasMarkers) {
            return `「${this.commitNotePath()}」里的待填区标记不见了，请把 ${NOTE_PENDING_START} 和 ${NOTE_PENDING_END} 加回去`;
        }
        if (!note.title) return '还没写提交标题';
        if (this.settings.requireCommitBody && !note.body) return '还没写提交说明';
        return '';
    }

    formatNoteEntry(title, body) {
        let out = `- ${stamp(new Date())} · **${title}**`;
        if (body) {
            for (const line of body.split('\n')) out += `\n  ${line}`;
        }
        return out + '\n';
    }

    // 把这次的说明追加到「历史」，同时清空待填区，让这份记录和本次改动一起进同一个 commit
    writeCommitNote(note, title, body) {
        const abs = this.noteAbsPath();
        let text = note.text;

        const s = text.indexOf(NOTE_PENDING_START);
        const e = text.indexOf(NOTE_PENDING_END);
        if (s !== -1 && e > s) {
            const fresh = `\n标题：\n说明：\n`;
            text = text.slice(0, s + NOTE_PENDING_START.length) + fresh + text.slice(e);
        } else {
            logWarn('找不到待填区标记，这次不清空标题/说明（避免误删内容）');
        }

        text = text.replace(/\s*$/, '\n\n') + this.formatNoteEntry(title, body);
        fs.writeFileSync(abs, text, 'utf8');
        return text;
    }

    async openCommitNote() {
        const rel = this.commitNotePath();
        this.readCommitNote(true); // 保证文件存在，否则打不开
        try {
            const file = this.app.vault.getAbstractFileByPath(rel);
            if (file) {
                await this.app.workspace.getLeaf(true).openFile(file);
                return true;
            }
        } catch (e) {
            logWarn('打开提交记录失败: ' + e.message);
        }
        try {
            this.app.workspace.openLinkText(rel, '', false);
            return true;
        } catch (_) {
            return false;
        }
    }

    // 两台电脑都往同一个日志文件追加时，默认合并会冲突。
    // union 是 git 内置合并驱动，标记一下就能让「两边各加一行」自动合并成功。
    ensureNoteMergeDriver(vault) {
        if (!this.settings.commitNoteEnabled) return;
        try {
            const rel = this.commitNotePath();
            const line = `${rel.replace(/ /g, '\\ ')} merge=union`;
            const file = path.join(vault, '.gitattributes');
            const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

            if (text.split('\n').some((l) => l.trim() === line)) return;

            fs.writeFileSync(file, text.replace(/\s*$/, '\n\n').replace(/^\n+/, '') + line + '\n', 'utf8');
            logInfo(`已在 .gitattributes 标记「${rel}」用 union 合并，两台电脑同时记录也不会冲突`);
        } catch (e) {
            logWarn('写入 .gitattributes 失败: ' + e.message);
        }
    }

    // ---------- 状态 ----------

    setStatus(patch) {
        Object.assign(this.status, patch);
        this.renderStatus();
    }

    renderStatus() {
        if (!this.statusEl) return;
        const s = this.status;
        let text = 'GitHub';
        let tip = '';
        const lines = [];

        if (s.state === 'unconfigured') {
            text = 'GitHub 未配置';
            const missing = [];
            if (!(this.settings.repoUrl || '').trim()) missing.push('仓库地址');
            if (!this.getToken()) missing.push('Token');
            tip = `还缺：${missing.join('、')}。\n\n点击这里直接打开设置页填写。`;
        } else if (s.state === 'no-repo') {
            text = 'GitHub 未初始化';
            tip = '这个 vault 还不是 git 仓库。\n点同步按钮会自动 git init。';
        } else if (s.state === 'busy') {
            text = 'GitHub 同步中…';
            tip = '正在和远端通信';
        } else if (s.state === 'offline') {
            text = 'GitHub 离线';
            tip = '连不上远端。\n\n' + (s.message || '');
        } else if (s.state === 'error') {
            text = 'GitHub 出错';
            tip = s.message || '';
        } else if (s.state === 'need-note') {
            text = 'GitHub 待写提交说明';
            tip =
                `${s.message || '还没写提交标题'}。\n\n` +
                `请打开「${this.commitNotePath()}」写好标题和说明，\n再点一次同步（这次一个字节都没提交）。`;
        } else {
            const bits = [];
            if (s.behind > 0) bits.push(`↓${s.behind}`);
            if (s.ahead > 0) bits.push(`↑${s.ahead}`);
            if (bits.length) text = 'GitHub ' + bits.join(' ');
            else if (s.dirty > 0) text = `GitHub ●${s.dirty} 未提交`;
            else text = 'GitHub 已最新';

            lines.push(`分支: ${this.branch()}`);
            if (s.remoteEmpty) {
                lines.push('远端: 空仓库（还没推送过）');
            } else {
                lines.push(`远端新提交: ${s.behind}`);
                lines.push(`本地待推送: ${s.ahead}`);
            }
            lines.push(`未提交改动: ${s.dirty}`);

            // 有改动时把待提交的说明也显示出来，点同步前心里有数
            if (s.dirty > 0 && this.settings.commitNoteEnabled) {
                const note = this.readCommitNote(false);
                if (note.ok) {
                    lines.push(`本次提交说明: ${note.title ? note.title : '（还没写）'}`);
                }
            }

            lines.push(`上次同步: ${s.lastSync ? stamp(s.lastSync) : '本次会话还没有'}`);
            if (s.checkedAt) lines.push(`状态检查: ${clock(s.checkedAt)}`);
            lines.push('');
            lines.push('点击立即重新检查');
            tip = lines.join('\n');
        }

        // 鼠标悬停能看到当前实际运行的版本，方便确认插件到底重载没有
        tip = (tip ? tip + '\n\n' : '') + `运行版本：${VERSION}`;
        this.statusEl.setText(text);
        this.statusEl.setAttribute('aria-label', tip);
        this.statusEl.title = tip;
    }

    async refreshStatus(opts) {
        opts = opts || {};
        if (this.busy) return;

        if (!this.isConfigured()) {
            this.setStatus({ state: 'unconfigured' });
            if (opts.announce) {
                new Notice('Quick GitHub Sync: 请先填写仓库地址和 Token');
                this.openSettings();
            }
            return;
        }

        const vault = this.vaultPath();
        let root = null;
        try {
            root = await this.run(['-C', vault, 'rev-parse', '--show-toplevel'], { quiet: true });
        } catch (_) {
            root = null;
        }
        if (!root) {
            logWarn('这个 vault 还不是 git 仓库，跳过状态检查');
            this.setStatus({ state: 'no-repo' });
            if (opts.announce) new Notice('Quick GitHub Sync: 这个 vault 还不是 git 仓库');
            return;
        }

        this.setStatus({ state: 'busy', message: '' });
        logInfo('=== 检查远端状态 ===');

        try {
            const dirty = await this.dirtyCount(vault);
            const { empty } = await this.fetchRemote(vault);
            const { behind, ahead, remoteEmpty } = await this.aheadBehind(vault);
            const state = behind > 0 ? 'behind' : dirty > 0 || ahead > 0 ? 'pending' : 'synced';

            this.setStatus({
                state,
                behind,
                ahead,
                dirty,
                remoteEmpty: remoteEmpty || empty,
                checkedAt: new Date(),
                message: '',
            });

            logInfo(`状态: 远端新增 ${behind} | 待推送 ${ahead} | 未提交 ${dirty}`);
            if (opts.announce) {
                if (behind > 0) {
                    new Notice(`Quick GitHub Sync: 远端有 ${behind} 个新提交，点同步即可拉取`);
                } else if (dirty > 0 || ahead > 0) {
                    new Notice(
                        `Quick GitHub Sync: 本地有 ${dirty} 项未提交改动、${ahead} 个待推送提交`
                    );
                } else {
                    new Notice('Quick GitHub Sync: 已是最新');
                }
            }
        } catch (e) {
            this.setStatus({ state: 'offline', checkedAt: new Date(), message: e.message });
            if (opts.announce) new Notice('Quick GitHub Sync: 连不上远端\n' + e.message);
        }
    }

    // ---------- 同步 ----------

    async sync() {
        if (this.busy) {
            new Notice('Quick GitHub Sync: 正在同步中，请稍候');
            return;
        }
        if (!this.isConfigured()) {
            this.setStatus({ state: 'unconfigured' });
            new Notice('Quick GitHub Sync: 请先填写仓库地址和 Token，正在打开设置页…');
            this.openSettings();
            return;
        }

        const vault = this.vaultPath();
        const name = this.remote();
        const branch = this.branch();

        this.busy = true;
        this.setStatus({ state: 'busy', message: '' });
        new Notice('Quick GitHub Sync: 开始同步…');
        logInfo('===== 同步开始 =====');

        try {
            await this.ensureRepo(vault);

            // 1) 有改动才需要提交说明；只是拉取远端（本地没动过）不该拦着用户
            await this.run(['-C', vault, 'add', '-A']);
            let dirty = await this.dirtyCount(vault);

            if (dirty > 0) {
                let messageArgs;

                if (this.settings.commitNoteEnabled) {
                    const note = this.readCommitNote(true);
                    const problem = this.validateCommitNote(note);

                    if (problem) {
                        // 说清楚缺什么，直接把人送到那个文件，一个字节都不提交
                        logWarn('缺少提交说明，已中止: ' + problem);
                        this.setStatus({ state: 'need-note', message: problem, checkedAt: new Date() });
                        new Notice(
                            `Quick GitHub Sync: ${problem}。\n` +
                                `请在「${this.commitNotePath()}」里写好标题和说明，再点一次同步。`,
                            12000
                        );
                        await this.openCommitNote();
                        return;
                    }

                    this.writeCommitNote(note, note.title, note.body);
                    logInfo('提交说明: ' + note.title);
                    messageArgs = ['-m', note.title];
                    if (note.body) messageArgs.push('-m', note.body);
                } else {
                    messageArgs = ['-m', `Obsidian Auto Sync ${stamp(new Date())}`];
                }

                // 记录文件的更新要重新 add，这样它和本次改动进同一个 commit
                await this.run(['-C', vault, 'add', '-A']);
                dirty = await this.dirtyCount(vault);
                await this.run(['-C', vault, 'commit'].concat(messageArgs));
                logInfo(`已提交本地 ${dirty} 项改动`);
            } else {
                logInfo('本地没有需要提交的改动');
            }

            // 2) 拉远端；落后就先 rebase 追上去
            const { empty } = await this.fetchRemote(vault);
            let pulled = 0;
            if (empty) {
                logInfo('远端为空，跳过合并，准备首推');
            } else {
                const ref = `refs/remotes/${name}/${branch}`;
                pulled = await this.count(vault, `HEAD..${ref}`);
                if (pulled > 0) {
                    logInfo(`远端有 ${pulled} 个新提交，rebase 到本地之上`);
                    try {
                        await this.run(['-C', vault, 'rebase', ref], { timeout: NET_TIMEOUT_MS });
                    } catch (e) {
                        try {
                            await this.run(['-C', vault, 'rebase', '--abort']);
                            logWarn('已回滚 rebase');
                        } catch (_) {
                            /* 忽略 */
                        }
                        throw new Error(
                            '追上远端时发生冲突，已回滚到同步前的状态。\n' +
                                '请手动处理冲突后重试。\n\n' +
                                e.message
                        );
                    }
                } else {
                    logInfo('远端没有新提交');
                }
            }

            // 3) 推送
            const hasHead = await this.refExists(vault, 'HEAD');
            if (!hasHead) {
                logInfo('本地还没有任何提交，跳过推送');
            } else {
                await this.run(['-C', vault, 'push', name, `HEAD:refs/heads/${branch}`], {
                    auth: true,
                    timeout: NET_TIMEOUT_MS,
                });
                logInfo('推送完成');
                try {
                    await this.run(['-C', vault, 'branch', `--set-upstream-to=${name}/${branch}`, branch]);
                } catch (_) {
                    /* 忽略 */
                }
            }

            const dirtyAfter = await this.dirtyCount(vault);
            const { behind, ahead } = await this.aheadBehind(vault);
            this.setStatus({
                state: behind > 0 ? 'behind' : dirtyAfter > 0 || ahead > 0 ? 'pending' : 'synced',
                behind,
                ahead,
                dirty: dirtyAfter,
                remoteEmpty: false,
                lastSync: new Date(),
                checkedAt: new Date(),
                message: '',
            });

            const summary = pulled > 0 ? `同步完成（拉取 ${pulled} 个远端提交）` : '同步完成';
            new Notice('Quick GitHub Sync: ' + summary);
            logInfo('===== ' + summary + ' =====');
        } catch (e) {
            logError('同步失败: ' + e.message);
            this.setStatus({ state: 'error', message: e.message, checkedAt: new Date() });
            new Notice('Quick GitHub Sync: 同步失败\n' + e.message, 12000);
            // 缺提交者身份 / 缺仓库地址这类问题，直接把人送到能改的地方
            if (/user\.name|user\.email|提交者|仓库地址|Token/.test(e.message)) this.openSettings();
        } finally {
            this.busy = false;
            this.renderStatus();
        }
    }
}

class QuickGitHubSyncSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        const p = this.plugin;
        containerEl.empty();
        containerEl.addClass('quick-github-sync-settings');

        containerEl.createEl('h2', { text: `Quick GitHub Sync（本地增强版 ${VERSION}）` });

        // ---- 缺什么就明说什么，别让用户自己猜 ----
        const hintBox = containerEl.createEl('div', { cls: 'qgs-hint' });
        const refreshHint = () => {
            hintBox.empty();
            const missing = [];
            if (!(p.settings.repoUrl || '').trim()) missing.push('仓库地址');
            if (!p.getToken()) missing.push('Personal Access Token');

            const name = (p.settings.userName || '').trim();
            const email = (p.settings.userEmail || '').trim();
            const probe = p.identityProbe;

            let idLine;
            if (name && email) idLine = `提交者身份：用你填写的 ${name} <${email}>`;
            else if (probe && probe.name && probe.email)
                idLine = `提交者身份：沿用 git 已有配置（${probe.name} <${probe.email}>）`;
            else if (probe) idLine = '⚠ 提交者身份还没配，同步时 git 会拒绝提交 —— 请在下面的「提交者身份」里填写';
            else idLine = '提交者身份：读取中…';

            if (!missing.length) {
                hintBox.removeClass('qgs-hint-warn');
                hintBox.addClass('qgs-hint-ok');
                hintBox.createEl('strong', { text: '✓ 仓库地址和 Token 都齐了。' });
                hintBox.createEl('div', { text: idLine });
                return;
            }

            hintBox.removeClass('qgs-hint-ok');
            hintBox.addClass('qgs-hint-warn');
            hintBox.createEl('strong', { text: '还缺：' + missing.join('、') });
            hintBox.createEl('div', {
                text: '1) 仓库地址填 HTTPS 形式，例如 https://github.com/用户名/仓库.git',
            });
            hintBox.createEl('div', {
                text:
                    '2) 到 GitHub → Settings → Developer settings → Personal access tokens 生成 Token' +
                    '（经典 Token 勾 repo；细粒度 Token 给 Contents: Read and write），粘贴到下面的 Token 输入框',
            });
            hintBox.createEl('div', {
                text: '3) Token 只存在本机 Obsidian 里，不会写进 vault，因此不会被提交到 GitHub',
            });
            hintBox.createEl('div', { text: idLine });
        };
        refreshHint();

        const statusBox = containerEl.createEl('div', { cls: 'quick-github-sync-status-box' });
        const refreshStatusBox = () => {
            const s = p.status;
            const parts = [];
            parts.push(`分支 ${p.branch()}`);
            if (s.remoteEmpty) parts.push('远端空仓库');
            else {
                parts.push(`远端新提交 ${s.behind}`);
                parts.push(`待推送 ${s.ahead}`);
            }
            parts.push(`未提交 ${s.dirty}`);
            parts.push(`上次同步 ${s.lastSync ? stamp(s.lastSync) : '—'}`);
            statusBox.setText('当前状态：' + parts.join(' · ') + (s.message ? `\n${s.message}` : ''));
        };
        refreshStatusBox();

        let tokenInput = null;

        new Setting(containerEl)
            .setName('仓库地址')
            .setDesc('要同步到的 GitHub 仓库，HTTPS 形式，填完会自动设置 git remote')
            .addText((t) =>
                t
                    .setPlaceholder('https://github.com/username/repo.git')
                    .setValue(p.settings.repoUrl)
                    .onChange(async (v) => {
                        p.settings.repoUrl = v.trim();
                        await p.saveSettings();
                        refreshHint();
                    })
            );

        // ---- 提交者身份：决定 commit 的 author ----
        containerEl.createEl('h3', { text: '提交者身份（commit 的 author）' });
        containerEl.createEl('p', {
            text:
                '填一次就行，插件会自动写进本仓库的 git 配置（user.name / user.email）。' +
                '留空则沿用你电脑上已有的 git 全局配置；两边都没有时，同步会失败并提示。',
            cls: 'setting-item-description',
        });

        let nameInput = null;
        let emailInput = null;

        new Setting(containerEl)
            .setName('提交者名字')
            .setDesc('每次自动提交的作者名，例如 WangSnowchen')
            .addText((t) => {
                nameInput = t;
                t.setPlaceholder('你的名字')
                    .setValue(p.settings.userName)
                    .onChange(async (v) => {
                        p.settings.userName = v.trim();
                        await p.saveSettings();
                        refreshHint();
                    });
                t.inputEl.addEventListener('blur', async () => {
                    await p.pushIdentityToGit();
                    refreshHint();
                });
            });

        new Setting(containerEl)
            .setName('提交者邮箱')
            .setDesc('建议填 GitHub 账号绑定的邮箱，这样提交才会归属到你的账号')
            .addText((t) => {
                emailInput = t;
                t.setPlaceholder('you@example.com')
                    .setValue(p.settings.userEmail)
                    .onChange(async (v) => {
                        p.settings.userEmail = v.trim();
                        await p.saveSettings();
                        refreshHint();
                    });
                t.inputEl.addEventListener('blur', async () => {
                    await p.pushIdentityToGit();
                    refreshHint();
                });
            });

        // 异步读一下 git 现在实际生效的身份，放进占位符里当参考
        p.currentIdentity()
            .then(() => {
                if (nameInput && !nameInput.inputEl.value && p.identityProbe && p.identityProbe.name) {
                    nameInput.setPlaceholder(`当前 git 配置：${p.identityProbe.name}`);
                }
                if (emailInput && !emailInput.inputEl.value && p.identityProbe && p.identityProbe.email) {
                    emailInput.setPlaceholder(`当前 git 配置：${p.identityProbe.email}`);
                }
                refreshHint();
            })
            .catch(() => {});

        // ---- 提交说明 ----
        containerEl.createEl('h3', { text: '提交说明（每次提交前写）' });
        containerEl.createEl('p', {
            text:
                `同步时会把「${p.commitNotePath()}」里写好的内容当作 commit 的标题和正文，` +
                '并把「时间 + 标题 + 说明」追加到该文件的「历史」里。' +
                '有改动但还没写标题时，同步会被拦下来提醒你先写，不会提交。' +
                '（只是拉取远端、本地没动过时不会被拦。）',
            cls: 'setting-item-description',
        });

        const notePreview = containerEl.createEl('div', { cls: 'quick-github-sync-status-box' });
        const refreshNotePreview = () => {
            const path = p.commitNotePath();
            if (!p.settings.commitNoteEnabled) {
                notePreview.setText('提交说明：已关闭，将使用自动生成的提交信息。');
                return;
            }
            const note = p.readCommitNote(false);
            if (!note.ok) {
                notePreview.setText(`提交说明：还没写（首次同步会自动创建「${path}」）`);
                return;
            }
            if (!note.hasMarkers) {
                notePreview.setText(`提交说明：「${path}」的待填区标记不见了，同步会被拦下`);
                return;
            }
            notePreview.setText(
                `提交说明：标题「${note.title || '（空）'}」 · 说明「${note.body || '（空）'}」\n` +
                    `文件：${path}`
            );
        };
        refreshNotePreview();

        new Setting(containerEl)
            .setName('启用提交说明文件')
            .setDesc('关闭后回到原来的行为：用「Obsidian Auto Sync 时间」当提交信息')
            .addToggle((t) =>
                t.setValue(!!p.settings.commitNoteEnabled).onChange(async (v) => {
                    p.settings.commitNoteEnabled = v;
                    await p.saveSettings();
                    if (v) p.ensureNoteMergeDriver(p.vaultPath());
                    refreshNotePreview();
                    refreshHint();
                })
            );

        new Setting(containerEl)
            .setName('提交记录文件路径')
            .setDesc('相对 vault 根目录的路径，默认 提交记录.md。改完会自动把新路径加进 .gitattributes')
            .addText((t) =>
                t
                    .setPlaceholder('提交记录.md')
                    .setValue(p.settings.commitNotePath)
                    .onChange(async (v) => {
                        p.settings.commitNotePath = v.trim();
                        await p.saveSettings();
                        p.ensureNoteMergeDriver(p.vaultPath());
                        refreshNotePreview();
                    })
            );

        new Setting(containerEl)
            .setName('必须填写说明')
            .setDesc('打开时标题和说明都不能为空；关闭时只强制要求标题')
            .addToggle((t) =>
                t.setValue(!!p.settings.requireCommitBody).onChange(async (v) => {
                    p.settings.requireCommitBody = v;
                    await p.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('提交记录')
            .setDesc('打开那个 md 文档写这次的标题和说明')
            .addButton((b) =>
                b.setButtonText('打开提交记录').onClick(async () => {
                    await p.openCommitNote();
                })
            )
            .addButton((b) =>
                b.setButtonText('刷新').onClick(() => refreshNotePreview())
            );

        new Setting(containerEl)
            .setName('Personal Access Token')
            .setDesc(
                '需要 repo（或 Contents: Read and write）权限的 GitHub PAT。' +
                    '只保存在本机 Obsidian 的 localStorage 里，不会写进 vault，也不会被提交到仓库。'
            )
            .addText((t) => {
                tokenInput = t.inputEl;
                t.inputEl.type = 'password';
                t.inputEl.autocomplete = 'off';
                t.inputEl.spellcheck = false;
                t.setPlaceholder('ghp_... 或 github_pat_...')
                    .setValue(p.getToken())
                    .onChange((v) => {
                        p.setToken(v);
                        refreshHint();
                    });
                t.inputEl.addEventListener('blur', () => {
                    const v = t.inputEl.value.trim();
                    if (v !== p.getToken()) p.setToken(v);
                    refreshHint();
                });
            })
            .addExtraButton((b) =>
                b
                    .setIcon('eye')
                    .setTooltip('显示 / 隐藏 Token')
                    .onClick(() => {
                        if (!tokenInput) return;
                        const show = tokenInput.type === 'password';
                        tokenInput.type = show ? 'text' : 'password';
                        b.setIcon(show ? 'eye-off' : 'eye');
                    })
            )
            .addExtraButton((b) =>
                b
                    .setIcon('trash')
                    .setTooltip('清除本机保存的 Token')
                    .onClick(() => {
                        p.setToken('');
                        if (tokenInput) tokenInput.value = '';
                        refreshHint();
                        new Notice('Quick GitHub Sync: 已清除本机保存的 Token');
                    })
            );

        new Setting(containerEl)
            .setName('分支')
            .setDesc('要同步的分支，默认 main')
            .addText((t) =>
                t
                    .setPlaceholder('main')
                    .setValue(p.settings.branch)
                    .onChange(async (v) => {
                        p.settings.branch = v.trim();
                        await p.saveSettings();
                        refreshStatusBox();
                    })
            );

        new Setting(containerEl)
            .setName('remote 名称')
            .setDesc('默认 origin，一般不用改')
            .addText((t) =>
                t
                    .setPlaceholder('origin')
                    .setValue(p.settings.remote)
                    .onChange(async (v) => {
                        p.settings.remote = v.trim();
                        await p.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('自动检查远端状态')
            .setDesc('每隔几分钟 fetch 一次，用来在状态栏显示远端是否最新。只读，不会提交或上传。填 0 关闭。')
            .addText((t) =>
                t
                    .setPlaceholder('5')
                    .setValue(String(p.settings.statusRefreshMinutes))
                    .onChange(async (v) => {
                        p.settings.statusRefreshMinutes = Number(v) || 0;
                        await p.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('git 可执行文件')
            .setDesc('留空则使用 PATH 里的 git')
            .addText((t) =>
                t
                    .setPlaceholder('git')
                    .setValue(p.settings.gitPath)
                    .onChange(async (v) => {
                        p.settings.gitPath = v.trim();
                        await p.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('操作')
            .setDesc('建议先「测试连接」确认仓库地址和 Token 都对，再点「同步」。')
            .addButton((b) =>
                b.setButtonText('测试连接').onClick(async () => {
                    await p.testConnection();
                    refreshStatusBox();
                })
            )
            .addButton((b) =>
                b.setButtonText('检查状态').onClick(async () => {
                    await p.refreshStatus({ announce: true });
                    refreshStatusBox();
                })
            )
            .addButton((b) =>
                b
                    .setButtonText('立即同步')
                    .setCta()
                    .onClick(async () => {
                        await p.sync();
                        refreshStatusBox();
                        refreshNotePreview();
                        refreshHint();
                    })
            );

        containerEl.createEl('p', {
            text:
                '同步逻辑：先提交本地改动 → 拉取远端（rebase）→ 推送。' +
                '详细日志在开发者控制台（Ctrl+Shift+I → Console），前缀 [Quick GitHub Sync]。',
            cls: 'setting-item-description',
        });
    }
}

module.exports = QuickGitHubSyncPlugin;

/* nosourcemap */
