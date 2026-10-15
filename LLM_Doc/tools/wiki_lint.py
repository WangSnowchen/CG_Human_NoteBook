"""LLM_Doc 结构检查。

检查断链、缺回链、孤立页、未进 index、frontmatter、疑似敏感信息，并列出 disputed 页面。
用法：python3 LLM_Doc/tools/wiki_lint.py [vault 根目录]
有错误时退出码为 1。规则见 LLM_Doc/AGENTS.md。
"""

import os
import re
import sys

LLM_DIR_NAME = "LLM_Doc"
SKIP_DIRS = {".git", ".obsidian", ".trash"}

TYPES_BY_DIR = {
    "entities": "entity",
    "concepts": "concept",
    "problems": "problem",
    "sources": "source",
    "syntheses": "synthesis",
}
REQUIRED_FIELDS = [
    "type",
    "aliases",
    "tags",
    "applies_to",
    "sources",
    "human_notes",
    "status",
    "created",
    "updated",
]
SOURCE_FIELDS = ["origin", "ingested"]
STATUSES = {"active", "disputed", "stale"}

WIKILINK = re.compile(r"!?\[\[([^\]\|#]*)(#[^\]\|]*)?(\|[^\]]*)?\]\]")
FENCE = re.compile(r"^\s*(```|~~~)")
INLINE_CODE = re.compile(r"`[^`]*`")

SENSITIVE = [
    ("密码 / password", re.compile(r"(密码|password|passwd)\s*[:：=]\s*\S+", re.I)),
    ("token / key", re.compile(r"(token|api[_ ]?key|secret)\s*[:：=]\s*\S{8,}", re.I)),
    ("疑似 API key", re.compile(r"\b(sk-[A-Za-z0-9]{16,}|AIza[0-9A-Za-z_\-]{20,}|AQ\.[0-9A-Za-z_\-]{20,})")),
    (
        "内部 IP",
        re.compile(
            r"\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
            r"|192\.168\.\d{1,3}\.\d{1,3}"
            r"|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b"
        ),
    ),
]


def walkVault(root):
    """返回 vault 内所有文件的相对路径（/ 分隔）。"""
    result = []
    for dirPath, dirNames, fileNames in os.walk(root):
        dirNames[:] = [d for d in dirNames if d not in SKIP_DIRS]
        for name in fileNames:
            full = os.path.join(dirPath, name)
            result.append(os.path.relpath(full, root).replace(os.sep, "/"))
    return result


def buildResolver(files):
    """按 Obsidian 规则建立链接名到文件的映射：md 不带扩展名，其余带扩展名，也认带目录的写法。"""
    byName = {}
    byPath = set()
    for rel in files:
        base = rel.rsplit("/", 1)[-1]
        key = base[:-3] if base.endswith(".md") else base
        byName.setdefault(key.lower(), []).append(rel)
        byPath.add((rel[:-3] if rel.endswith(".md") else rel).lower())
    return byName, byPath


def resolve(target, byName, byPath):
    target = target.strip()
    if not target:
        return None
    key = target.lower()
    if "/" in key:
        stem = key[:-3] if key.endswith(".md") else key
        for path in byPath:
            if path == stem or path.endswith("/" + stem):
                return path
        return None
    if key.endswith(".md"):
        key = key[:-3]
    hits = byName.get(key)
    if not hits:
        return None
    hit = hits[0].lower()
    return hit[:-3] if hit.endswith(".md") else hit


def splitFrontmatter(text):
    """返回 (frontmatter 行列表, 正文起始行号)。没有 frontmatter 返回 (None, 0)。"""
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return None, 0
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return lines[1:i], i + 1
    return None, 0


def parseFrontmatter(lines):
    """只处理本库用到的写法：key: value、key: [a, b]、key: 后跟 - item 列表。"""
    data = {}
    current = None
    for raw in lines:
        line = raw.split(" #", 1)[0].rstrip() if not raw.lstrip().startswith("- ") else raw.rstrip()
        if not line.strip():
            continue
        item = re.match(r"^\s+-\s+(.*)$", line) or re.match(r"^-\s+(.*)$", line)
        if item and current is not None:
            if not isinstance(data[current], list):
                data[current] = []
            data[current].append(item.group(1).strip().strip("\"'"))
            continue
        field = re.match(r"^([A-Za-z_]+):\s*(.*)$", line)
        if not field:
            continue
        current = field.group(1)
        value = field.group(2).strip()
        if value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            data[current] = [v.strip().strip("\"'") for v in inner.split(",")] if inner else []
        elif value == "":
            data[current] = []
        else:
            data[current] = value.strip("\"'")
    return data


def extractLinks(text):
    """返回 [(行号, 链接目标)]，跳过代码块和行内代码。"""
    links = []
    inFence = False
    for number, line in enumerate(text.split("\n"), 1):
        if FENCE.match(line):
            inFence = not inFence
            continue
        if inFence:
            continue
        for match in WIKILINK.finditer(INLINE_CODE.sub("", line)):
            links.append((number, match.group(1)))
    return links


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(here))
    llmDir = os.path.join(root, LLM_DIR_NAME)
    if not os.path.isdir(llmDir):
        sys.exit("找不到 %s" % llmDir)

    files = walkVault(root)
    byName, byPath = buildResolver(files)
    prefix = LLM_DIR_NAME + "/"
    wikiPrefix = prefix + "wiki/"

    errors = []
    warnings = []
    disputed = []

    def err(kind, where, message):
        errors.append((kind, where, message))

    def warn(kind, where, message):
        warnings.append((kind, where, message))

    # 同名 md 会让 [[链接]] 指向不确定
    for key, hits in sorted(byName.items()):
        mdHits = [h for h in hits if h.endswith(".md")]
        if len(mdHits) > 1 and any(h.startswith(wikiPrefix) for h in mdHits):
            err("重名", ", ".join(mdHits), "vault 内有同名页面，链接会指错")

    wikiPages = sorted(f for f in files if f.startswith(wikiPrefix) and f.endswith(".md"))
    wikiIds = {p[:-3].lower(): p for p in wikiPages}
    checked = wikiPages + [prefix + n for n in ("index.md", "log.md", "README.md") if prefix + n in files]

    outgoing = {}
    for rel in checked:
        with open(os.path.join(root, rel), encoding="utf-8") as handle:
            text = handle.read()
        pageId = rel[:-3].lower()
        targets = set()
        for number, target in extractLinks(text):
            resolved = resolve(target, byName, byPath)
            if resolved is None:
                err("断链", "%s:%d" % (rel, number), "[[%s]] 找不到" % target)
                continue
            if resolved != pageId:
                targets.add(resolved)
        outgoing[pageId] = targets

        if rel.startswith(wikiPrefix):
            for number, line in enumerate(text.split("\n"), 1):
                for label, pattern in SENSITIVE:
                    if pattern.search(line):
                        err("敏感信息", "%s:%d" % (rel, number), label)
            checkFrontmatter(rel, text, err, warn, disputed)

    inbound = {p: set() for p in wikiIds}
    for source, targets in outgoing.items():
        if source not in wikiIds:
            continue
        for target in targets:
            if target in wikiIds:
                inbound[target].add(source)

    for source in sorted(wikiIds):
        for target in sorted(outgoing.get(source, ())):
            if target in wikiIds and source not in outgoing.get(target, ()):
                err(
                    "缺回链",
                    wikiIds[target],
                    "被 [[%s]] 链接，但没有链回去" % wikiIds[source].rsplit("/", 1)[-1][:-3],
                )

    indexLinks = outgoing.get((prefix + "index").lower(), set())
    for pageId, rel in sorted(wikiIds.items()):
        if not inbound[pageId]:
            warn("孤立页", rel, "没有其他 wiki 页面链接到它")
        if pageId not in indexLinks:
            err("未进 index", rel, "index.md 里没有这一页")

    report(len(wikiPages), errors, warnings, disputed)
    sys.exit(1 if errors else 0)


def checkFrontmatter(rel, text, err, warn, disputed):
    lines, bodyStart = splitFrontmatter(text)
    if lines is None:
        err("frontmatter", rel, "缺少 frontmatter")
        return
    data = parseFrontmatter(lines)
    for field in REQUIRED_FIELDS:
        if field not in data:
            err("frontmatter", rel, "缺字段 %s" % field)
    parts = rel.split("/")
    expected = TYPES_BY_DIR.get(parts[2]) if len(parts) > 3 else None
    if expected is None:
        err("位置", rel, "页面要放在 wiki/ 下的五个分类目录之一")
    elif data.get("type") != expected:
        err("frontmatter", rel, "type 应为 %s，实际 %s" % (expected, data.get("type")))
    if expected == "source":
        for field in SOURCE_FIELDS:
            if not data.get(field):
                err("frontmatter", rel, "来源页缺字段 %s" % field)
    status = data.get("status")
    if status not in STATUSES:
        err("frontmatter", rel, "status 应为 active / disputed / stale，实际 %s" % status)
    if status == "disputed":
        disputed.append(rel)
    body = "\n".join(text.split("\n")[bodyStart:])
    if expected not in (None, "source") and not re.search(r"^##\s+相关\s*$", body, re.M):
        warn("结构", rel, "没有「## 相关」小节")


def report(pageCount, errors, warnings, disputed):
    print("wiki 页面：%d" % pageCount)
    for title, items in (("错误", errors), ("提醒", warnings)):
        print("\n%s：%d" % (title, len(items)))
        for kind, where, message in items:
            print("  [%s] %s —— %s" % (kind, where, message))
    print("\n有矛盾待确认（disputed）：%d" % len(disputed))
    for rel in disputed:
        print("  %s" % rel)


if __name__ == "__main__":
    main()
