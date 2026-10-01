/*
 * 显示隐藏文件（Show Dotfiles）v1.0.0
 * 让 . 开头的文件和文件夹出现在 Obsidian 原生文件浏览器里（.gitkeep、.obsidian/、.git/ 等）。
 *
 * ── 为什么要这么绕 ──────────────────────────────────────────────
 * Obsidian 的 Vault 索引把"路径中任意一段以 . 开头"的条目当成已删除处理，
 * 源码里的判定就是 Il(path)：任一段 startsWith(".") 即为真。于是：
 *
 *     Il(path) ? reconcileDeletion(path) : reconcileFileInternal(path)
 *
 * 隐藏条目永远进不了 vault.fileMap，而文件浏览器是遍历 getAllLoadedFiles() 建树的，
 * 所以它们不可能出现在原生文件树里。插件要做的事就是把这个判定"劫持"掉。
 *
 * ── 三步 ────────────────────────────────────────────────────────
 *   1) 挂钩 adapter 实例上的 reconcileDeletion：如果路径是隐藏的、但文件在磁盘上
 *      确实存在，就改调 reconcileFileInternal()，让 Obsidian 把它当普通文件收进索引，
 *      文件浏览器随即为它建行。
 *   2) Obsidian 的 adapter.list() 会过滤掉点开头的条目，靠它找不到
 *      "Resource Collection/Images/.gitkeep" 这种藏在非隐藏目录里的点文件，
 *      因此自己用 Node 的 fs.readdir 走一遍目录树补上。
 *   3) 关闭插件时先解除挂钩，再把这些条目交回 Obsidian 的默认逻辑（重新隐藏）。
 *
 * reconcileDeletion 拦截思路移植自 polyipseity/obsidian-show-hidden-files 与
 * josipmarkus/obsidian-reveal-hidden-files（均为 MIT）。它们和本插件一样依赖
 * Obsidian 未公开的内部方法（reconcileDeletion / reconcileFileInternal /
 * getRealPath / getFullPath / listRecursive）；这些方法在 1.13.7 上确认存在，
 * 但 Obsidian 大版本升级后若改名，本插件需要跟着改。
 *
 * 本插件只"读"目录名来决定显示什么，绝不创建、修改或删除任何 vault 文件。
 */

const { Plugin, PluginSettingTab, Setting, Notice, TFile, TFolder } = require('obsidian');
const fs = require('fs');
const path = require('path');

const LOG = '[Show Dotfiles]';
const VERSION = '1.0.0';

const logInfo = (...a) => console.log(LOG, ...a);
const logWarn = (...a) => console.warn(LOG, ...a);
const logError = (...a) => console.error(LOG, ...a);

const DEFAULT_SETTINGS = {
    // 默认就把隐藏内容显示出来——这是这个插件存在的唯一理由
    showHidden: true,
};

// 一次扫描最多查看多少个目录条目。正常 vault 远远到不了这个量，
// 它只是一道保险：万一哪天仓库里出现几十万文件的 .git/ 或 node_modules/，
// 宁可停下来警告，也不要把 Obsidian 界面卡死。
const MAX_ENTRIES = 20000;

// ────────────────────────── 工具函数 ──────────────────────────

/**
 * 路径中任意一段以 . 开头即视为隐藏（与 Obsidian 内部判定一致）。
 * "." 和 ".." 不算，避免相对路径误判。
 */
function isHiddenPath(vaultPath) {
    if (!vaultPath) return false;
    return vaultPath.split('/').some((seg) => seg.startsWith('.') && seg !== '.' && seg !== '..');
}

/**
 * 把一个方法替换成包装版，返回"还原函数"。
 * 直接给实例赋值，所以只影响 adapter 实例自己，不动原型。
 */
function around(obj, methodName, makeWrapper) {
    const original = obj[methodName];
    if (typeof original !== 'function') return () => {};
    obj[methodName] = makeWrapper(original);
    return () => {
        obj[methodName] = original;
    };
}

/** vault 树里这个路径现在是什么：folder / file / null / other */
function vaultKind(app, vaultPath) {
    const f = app.vault.getAbstractFileByPath(vaultPath);
    if (!f) return 'null';
    if (f instanceof TFolder) return 'folder';
    if (f instanceof TFile) return 'file';
    return 'other';
}

/**
 * 兜底移除：少数情况下 reconcileDeletion 调用成功、但条目还留在 vault.fileMap 和
 * 文件浏览器的 fileItems 里（参考插件在 v0.2.x 也遇到过同样症状，原因未明）。
 * 这时手动把三处痕迹清掉。用到的是 Obsidian 未公开字段：vault.fileMap、
 * view.fileItems、FileItem.el。
 */
function forceRemove(app, vaultPath) {
    const file = app.vault.getAbstractFileByPath(vaultPath);
    if (!file) return;

    // 1) 从父目录的 children 里摘掉
    const parent = file.parent;
    if (parent && Array.isArray(parent.children)) {
        const idx = parent.children.indexOf(file);
        if (idx >= 0) parent.children.splice(idx, 1);
    }

    // 2) 从 vault.fileMap 里删掉
    try {
        const fileMap = app.vault.fileMap;
        if (fileMap && Object.prototype.hasOwnProperty.call(fileMap, vaultPath)) {
            delete fileMap[vaultPath];
        }
    } catch (e) {
        logWarn('清理 fileMap 失败: ' + e.message);
    }

    // 3) 把文件浏览器里已经渲染出来的那一行也移除
    try {
        const leaf = app.workspace.getLeavesOfType('file-explorer')[0];
        const items = leaf && leaf.view && leaf.view.fileItems;
        if (items && items[vaultPath]) {
            const el = items[vaultPath].el;
            if (el && typeof el.remove === 'function') el.remove();
            delete items[vaultPath];
        }
    } catch (e) {
        logWarn('清理文件浏览器行失败: ' + e.message);
    }
}

// ────────────────────────── 插件主体 ──────────────────────────

class ShowDotfilesPlugin extends Plugin {
    async onload() {
        await this.loadSettings();

        this.hiddenPaths = new Set();    // 扫描到过的全部隐藏路径
        this.surfacedPaths = new Set();  // 其中已经收进 Obsidian 索引的
        this.inFlight = new Set();       // 正在 reconcile 的路径，防重入/防递归
        this.unpatch = null;
        this.busy = false;
        this.scanned = 0;
        this.capHit = false;
        this.extensionlessNotified = false;

        this.addRibbonIcon('eye', '显示 / 隐藏 . 开头的文件', () => this.toggleVisibility());

        this.addCommand({
            id: 'toggle-hidden-entries',
            name: '切换隐藏文件显示',
            callback: () => this.toggleVisibility(),
        });

        this.addCommand({
            id: 'rescan-hidden-entries',
            name: '重新扫描隐藏文件',
            callback: async () => {
                await this.scanAll();
                new Notice(`显示隐藏文件：扫描完成，已显示 ${this.surfacedPaths.size} 项`);
            },
        });

        this.addCommand({
            id: 'log-diagnostics',
            name: '在控制台输出诊断信息',
            callback: () => this.logDiagnostics(),
        });

        this.settingTab = new ShowDotfilesSettingTab(this.app, this);
        this.addSettingTab(this.settingTab);

        this.installAdapterPatch();

        this.app.workspace.onLayoutReady(() => {
            if (this.settings.showHidden) void this.scanAll();
            else logInfo('设置里显示隐藏文件是关闭的，跳过首次扫描');
        });

        // 版本信号：在 Obsidian 开发者控制台能看到这行，说明新代码确实被加载了。
        // 排查"改了没生效"时先看这行。
        logInfo(`v${VERSION} 已加载`);
    }

    onunload() {
        // 先解除挂钩，再把条目交回 Obsidian 的默认逻辑（重新隐藏）
        if (this.unpatch) {
            this.unpatch();
            this.unpatch = null;
        }
        void this.hideAll().then(() => logInfo('已卸载，隐藏条目恢复为不可见'));
    }

    // ---------- 挂钩 ----------

    /**
     * 核心：把 adapter.reconcileDeletion 换成"隐藏路径改走 reconcileFileInternal"。
     * 非隐藏路径原样透传，所以对 Obsidian 的正常行为零影响。
     */
    installAdapterPatch() {
        const adapter = this.app.vault.adapter;

        if (!adapter || typeof adapter.reconcileDeletion !== 'function') {
            logWarn('这个 vault 的 adapter 没有 reconcileDeletion，插件无法工作（只支持桌面端本地仓库）');
            return;
        }
        if (typeof adapter.reconcileFileInternal !== 'function') {
            logWarn('adapter 上没有 reconcileFileInternal，插件无法工作（Obsidian 版本可能变了）');
            return;
        }

        this.unpatch = around(adapter, 'reconcileDeletion', (original) => {
            // 原函数要用 adapter 作为 this 调用
            const callOriginal = (realPath, vaultPath) => original.call(adapter, realPath, vaultPath);

            return async (realPath, vaultPath) => {
                if (!isHiddenPath(vaultPath)) return callOriginal(realPath, vaultPath);

                try {
                    if (!this.existsOnDisk(vaultPath)) {
                        // 磁盘上真没了，交给 Obsidian 正常删除
                        this.hiddenPaths.delete(vaultPath);
                        this.surfacedPaths.delete(vaultPath);
                        return callOriginal(realPath, vaultPath);
                    }
                    this.hiddenPaths.add(vaultPath);
                    if (this.settings.showHidden) {
                        await this.surface(vaultPath);
                        return; // 已收进索引，不要再当删除处理
                    }
                } catch (e) {
                    logWarn(`处理隐藏路径失败（回退到 Obsidian 默认行为）: ${vaultPath} —— ${e.message}`);
                }
                return callOriginal(realPath, vaultPath);
            };
        });

        logInfo('已挂钩 reconcileDeletion');
    }

    // ---------- 路径换算与存在性 ----------

    /** vault 相对路径 → 系统绝对路径（Obsidian 的 getRealPath 在 macOS 上会纠正大小写） */
    realPathOf(vaultPath) {
        const adapter = this.app.vault.adapter;
        try {
            if (typeof adapter.getRealPath === 'function') return adapter.getRealPath(vaultPath);
        } catch (e) {
            logWarn('getRealPath 失败，退回 getFullPath: ' + e.message);
        }
        return this.fullPathOf(vaultPath);
    }

    /** vault 相对路径 → 系统绝对路径（不做大小写纠正） */
    fullPathOf(vaultPath) {
        const adapter = this.app.vault.adapter;
        try {
            if (typeof adapter.getFullPath === 'function') return adapter.getFullPath(vaultPath || '');
        } catch (e) {
            logWarn('getFullPath 失败，退回 getBasePath: ' + e.message);
        }
        const base = typeof adapter.getBasePath === 'function' ? adapter.getBasePath() : '';
        return vaultPath ? path.join(base, vaultPath) : base;
    }

    /**
     * 文件在磁盘上是否存在。
     * 这里刻意用 Node 的 fs 而不是 adapter._exists()：_exists 是未公开方法且参数顺序会变，
     * 而我们已经有绝对路径在手，直接查更稳。
     */
    existsOnDisk(vaultPath) {
        try {
            const abs = this.fullPathOf(vaultPath);
            if (!abs) return true; // 换算不出来就不拦，交给后续步骤报错
            return fs.existsSync(abs);
        } catch (e) {
            logWarn('检查文件是否存在失败: ' + e.message);
            return true;
        }
    }

    // ---------- 显示 / 隐藏 ----------

    /** 把单个隐藏路径收进 Obsidian 索引（文件浏览器会随即为它建行） */
    async surface(vaultPath) {
        const adapter = this.app.vault.adapter;
        if (typeof adapter.reconcileFileInternal !== 'function') return false;
        if (this.inFlight.has(vaultPath)) return false; // 防重入

        this.inFlight.add(vaultPath);
        try {
            await adapter.reconcileFileInternal(this.realPathOf(vaultPath), vaultPath);
            this.surfacedPaths.add(vaultPath);
            return true;
        } catch (e) {
            logWarn(`收进索引失败: ${vaultPath} —— ${e.message}`);
            return false;
        } finally {
            this.inFlight.delete(vaultPath);
        }
    }

    /** 把单个路径交回 Obsidian 的默认逻辑（重新隐藏） */
    async hide(vaultPath) {
        const adapter = this.app.vault.adapter;
        try {
            const before = vaultKind(this.app, vaultPath);
            await adapter.reconcileDeletion(this.realPathOf(vaultPath), vaultPath);
            const after = vaultKind(this.app, vaultPath);
            // 调用成功但条目还在 → 走兜底清理
            if (before !== 'null' && after !== 'null') forceRemove(this.app, vaultPath);
            this.surfacedPaths.delete(vaultPath);
        } catch (e) {
            logWarn(`取消显示失败: ${vaultPath} —— ${e.message}`);
        }
    }

    /** 把当前已显示的隐藏条目全部收回 */
    async hideAll() {
        // 先取数量：hide() 会边收边从 surfacedPaths 里删，循环后再读就永远是 0
        const targets = Array.from(this.surfacedPaths);
        for (const vaultPath of targets) {
            await this.hide(vaultPath);
        }
        logInfo(`已隐藏 ${targets.length} 项`);
    }

    // ---------- 扫描 ----------

    async scanAll() {
        if (this.busy) {
            logInfo('正在扫描中，跳过这次请求');
            return;
        }
        this.busy = true;
        this.scanned = 0;
        this.capHit = false;

        try {
            // 第一遍：让 Obsidian 自己走一遍目录树。它发现隐藏条目时会调用 reconcileDeletion，
            // 被我们的挂钩接住。这一遍能覆盖 .git/、.obsidian/ 这类隐藏目录"内部"的条目。
            try {
                await this.app.vault.adapter.listRecursive('');
            } catch (e) {
                logWarn('listRecursive 失败（不影响后面的自建扫描）: ' + e.message);
            }

            // 第二遍：Obsidian 不会重新走进"非隐藏"的父目录，
            // 所以 Resource Collection/Images/.gitkeep 这种必须自己用 fs 走一遍。
            await this.walk('/');

            this.logDiagnostics();
            this.notifyExtensionlessOnce();
        } catch (e) {
            logError('扫描失败: ' + e.message);
        } finally {
            this.busy = false;
        }
    }

    /**
     * 用 Node 的 fs.readdir 走目录树，找出 Obsidian 的 adapter.list 会过滤掉的隐藏条目。
     * 注意：不用 fs.stat 跟随符号链接（readdir 的 withFileTypes 对符号链接 isDirectory() 为 false），
     * 所以不会陷入链接环。
     */
    async walk(parentPath) {
        if (this.capHit) return;

        let entries;
        try {
            const fullParent = this.fullPathOf(parentPath === '/' ? '' : parentPath);
            entries = await fs.promises.readdir(fullParent, { withFileTypes: true });
        } catch (e) {
            return; // 读不到（权限、路径已不存在）就跳过这一层
        }

        this.scanned += entries.length;
        if (this.scanned > MAX_ENTRIES) {
            this.capHit = true;
            logWarn(`扫描条目数超过上限 ${MAX_ENTRIES}，已停止继续深入。剩余的隐藏文件可以在设置里点「重新扫描」重试，或把大目录移出 vault。`);
            new Notice(`显示隐藏文件：目录太多，已停在 ${MAX_ENTRIES} 项。详见控制台。`, 8000);
            return;
        }

        const show = this.settings.showHidden;

        // 先把这一层的隐藏条目交给 Obsidian 收进索引。
        // 必须排在递归之前：父目录还没进索引时，给它的子条目建行会失败。
        for (const entry of entries) {
            const name = entry.name;
            if (!name.startsWith('.') || name === '.' || name === '..') continue;
            const childPath = parentPath === '/' ? name : `${parentPath}/${name}`;
            this.hiddenPaths.add(childPath);
            if (show && !this.surfacedPaths.has(childPath)) {
                await this.surface(childPath);
            }
        }

        // 再递归进子目录。隐藏目录只在"要显示"时才深入，否则里面的条目没有意义。
        let visited = 0;
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const name = entry.name;
            if (name === '.' || name === '..') continue;
            if (name.startsWith('.') && !show) continue;

            const childPath = parentPath === '/' ? name : `${parentPath}/${name}`;
            await this.walk(childPath);

            // 每 50 个目录让出一次事件循环，避免界面卡顿
            if (++visited % 50 === 0) await new Promise((r) => setTimeout(r, 0));
            if (this.capHit) return;
        }
    }

    // ---------- 开关 ----------

    async toggleVisibility() {
        if (this.busy) {
            new Notice('显示隐藏文件：正在扫描中，请稍候');
            return;
        }
        await this.setShowHidden(!this.settings.showHidden);
        new Notice(this.settings.showHidden
            ? `隐藏文件：已显示（${this.surfacedPaths.size} 项）`
            : '隐藏文件：已隐藏');
    }

    async setShowHidden(value) {
        this.settings.showHidden = !!value;
        await this.saveSettings();

        if (this.settings.showHidden) await this.scanAll();
        else await this.hideAll();

        // 让设置面板上的开关和统计跟着刷新
        try {
            if (this.settingTab && this.settingTab.display) this.settingTab.display();
        } catch (e) {
            logWarn('刷新设置面板失败: ' + e.message);
        }
    }

    // ---------- 无扩展名文件（.gitkeep 这类） ----------

    /** 读 Obsidian 自己的「检测所有文件扩展名」（设置 → 文件与链接） */
    isUnsupportedVisible() {
        try {
            return !!this.app.vault.getConfig('showUnsupportedFiles');
        } catch (e) {
            logWarn('读取 showUnsupportedFiles 失败: ' + e.message);
            return false;
        }
    }

    /** 改的是 Obsidian 自己的设置项，改完在官方设置页里也能看到 */
    setUnsupportedVisible(value) {
        try {
            this.app.vault.setConfig('showUnsupportedFiles', !!value);
        } catch (e) {
            logWarn('修改 showUnsupportedFiles 失败: ' + e.message);
            new Notice('显示隐藏文件：改不动这项设置，请手动到「设置 → 文件与链接 → 检测所有文件扩展名」打开');
        }
    }

    /** 没有扩展名的隐藏文件（.gitkeep、.env 这类）在文件浏览器里被 CSS 隐藏，提醒一次 */
    countExtensionless() {
        let n = 0;
        for (const p of this.hiddenPaths) {
            const name = p.split('/').pop();
            if (name.startsWith('.') && name.indexOf('.', 1) === -1) n++;
        }
        return n;
    }

    notifyExtensionlessOnce() {
        if (this.extensionlessNotified) return;
        if (!this.settings.showHidden) return;
        if (this.isUnsupportedVisible()) return;

        const n = this.countExtensionless();
        if (n === 0) return;

        this.extensionlessNotified = true;
        new Notice(
            `显示隐藏文件：发现 ${n} 个无扩展名的隐藏文件（如 .gitkeep）。\n` +
            '它们需要打开「设置 → 文件与链接 → 检测所有文件扩展名」才会出现在文件浏览器里，' +
            '也可以在插件设置里一键打开。',
            12000
        );
    }

    // ---------- 诊断 ----------

    logDiagnostics() {
        const hidden = Array.from(this.hiddenPaths).sort();
        logInfo(`v${VERSION} 诊断：发现隐藏条目 ${hidden.length} 个，已收进索引 ${this.surfacedPaths.size} 个`);
        logInfo('隐藏条目清单:', hidden);
        if (this.capHit) logWarn(`扫描因为超过 ${MAX_ENTRIES} 项上限被中止，清单可能不完整`);
        if (!this.isUnsupportedVisible()) {
            logWarn('Obsidian 的「检测所有文件扩展名」是关闭的：.gitkeep 这类无扩展名文件即使进了索引也会被文件浏览器隐藏');
        }
        if (typeof this.app.vault.adapter.reconcileFileInternal !== 'function') {
            logError('adapter.reconcileFileInternal 不存在——Obsidian 版本可能不兼容，插件不会生效');
        }
    }

    // ---------- 设置存取 ----------

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) || {});
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

// ────────────────────────── 设置面板 ──────────────────────────

class ShowDotfilesSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('show-dotfiles-settings');

        containerEl.createEl('h2', { text: '显示隐藏文件' });
        containerEl.createEl('div', {
            cls: 'sdf-stats',
            text: `插件版本 v${VERSION} · 发现隐藏条目 ${this.plugin.hiddenPaths.size} 个 · 已显示 ${this.plugin.surfacedPaths.size} 个`,
        });

        // 说明：原理与代价
        const warn = containerEl.createDiv({ cls: 'sdf-hint sdf-hint-warn' });
        warn.createEl('strong', { text: '这个插件依赖 Obsidian 未公开的内部方法' });
        warn.appendText(
            '它拦截的是 Obsidian 内部把隐藏路径当作"已删除"的逻辑（reconcileDeletion / reconcileFileInternal）。' +
            '这些方法在 Obsidian 1.13.7 上确认可用，但官方随时可能改名或改行为，届时插件会失效——' +
            '症状是文件浏览器里看不到隐藏文件，控制台会打出 ' + LOG + ' 开头的警告。'
        );

        new Setting(containerEl)
            .setName('显示隐藏文件')
            .setDesc('打开后，. 开头的文件和文件夹会出现在左侧文件浏览器里。关闭会把它们收回，恢复 Obsidian 的默认行为。')
            .addToggle((t) => t
                .setValue(this.plugin.settings.showHidden)
                .onChange(async (v) => {
                    await this.plugin.setShowHidden(v);
                    this.display();
                }));

        new Setting(containerEl)
            .setName('让无扩展名的文件也显示')
            .setDesc('这一项改的是 Obsidian 自己的「设置 → 文件与链接 → 检测所有文件扩展名」。.gitkeep 这类没有扩展名的文件，即使被本插件收进索引，也会被文件浏览器隐藏，必须打开这项才能看到。')
            .addToggle((t) => t
                .setValue(this.plugin.isUnsupportedVisible())
                .onChange((v) => {
                    this.plugin.setUnsupportedVisible(v);
                    this.display();
                }));

        new Setting(containerEl)
            .setName('重新扫描')
            .setDesc('在 Obsidian 之外改动过文件系统（比如 git 切换分支、新建了隐藏文件夹）时，点一下重新扫描。')
            .addButton((b) => b
                .setButtonText('重新扫描')
                .onClick(async () => {
                    await this.plugin.scanAll();
                    this.display();
                    new Notice(`显示隐藏文件：扫描完成，已显示 ${this.plugin.surfacedPaths.size} 项`);
                }));

        new Setting(containerEl)
            .setName('输出诊断信息')
            .setDesc('把发现的隐藏条目清单、版本号、兼容性检查结果打到开发者控制台（Cmd+Option+I 打开）。排查问题时可先用它。')
            .addButton((b) => b
                .setButtonText('输出到控制台')
                .onClick(() => {
                    this.plugin.logDiagnostics();
                    new Notice('显示隐藏文件：诊断信息已输出到控制台');
                }));

        const info = containerEl.createDiv({ cls: 'sdf-hint sdf-hint-info' });
        info.createEl('strong', { text: '关于安全与性能' });
        info.appendText(
            '当前设置不屏蔽任何内容，包括 .git/ 与 .obsidian/。这个仓库里 .git/ 有 89 个文件、.obsidian/ 有 15 个，' +
            '完全不会拖慢 Obsidian；但如果以后换成 .git/ 里塞了几十万对象的大仓库，建议把大目录移出 vault。' +
            '另外请留意：隐藏文件里可能有密钥或 Token，截图分享前先确认。'
        );
    }
}

module.exports = ShowDotfilesPlugin;

/* nosourcemap */
