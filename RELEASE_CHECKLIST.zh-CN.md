[![English](https://img.shields.io/badge/English-Release_Checklist-blue)](RELEASE_CHECKLIST.md)
[![简体中文](https://img.shields.io/badge/简体中文-发布清单-green)](RELEASE_CHECKLIST.zh-CN.md)

# 发布清单

> **`movie-narrator-web` 发布的完成定义。** 在创建版本标签并发布到 PyPI 之前，
> 必须逐项核验并勾选本清单。项目按类别分组；每一项都附有核验命令或方法。

---

## 代码质量

- [ ] **前端类型检查通过**
  - 命令：`cd webui && npx tsc --noEmit`
  - 预期：无类型错误

- [ ] **后端可正常导入**
  - 命令：`python -c "import movie_narrator_web; print(movie_narrator_web.__version__)"`
  - 预期：打印发布版本，无 `ImportError`

- [ ] **导入时契约检查通过**
  - 命令：同上
  - 预期：`check_version()` 不抛 `ImportError` — 已安装的核心引擎满足
    `_MIN_CONTRACT`

---

## 测试

- [ ] **Web 包测试全部通过**
  - 命令：`pytest tests/ -v`
  - 预期：`XX passed`（0 失败，0 错误）
  - 说明：覆盖 `test_web_form.py`、`test_controller.py`、`test_web_api.py`

- [ ] **满足核心引擎契约**
  - 命令：`python -c "from movie_narrator.contract import CONTRACT_VERSION; print(CONTRACT_VERSION)"`
  - 预期：`(1, 0, 0)` 或更新 — 满足依赖下限

- [ ] **CI 矩阵通过**
  - 核验：GitHub Actions `ci.yml`
  - 预期：`frontend` 构建 + `web-tests` 矩阵（Python 3.10–3.13）全绿
  - 说明：CI 通过 `pip install git+...` 从 `main` 安装核心引擎

- [ ] **无偶发失败**
  - 命令：`pytest tests/ -v` 运行两次
  - 预期：两次运行结果一致

---

## 构建与打包

- [ ] **前端 SPA 可构建**
  - 命令：`cd webui && npm ci && npm run build`
  - 预期：输出落在 `src/movie_narrator_web/static/`，包含 `index.html` 及带哈希的
    `.js` / `.css` 资源

- [ ] **wheel 携带 SPA**
  - 命令：`python -m build && twine check dist/*`
  - 预期：`twine check` 通过；wheel 包含 `movie_narrator_web/static/index.html`
    及资源（由发布工作流核验）

- [ ] **版本来源对齐**
  - 核验：
    - `pyproject.toml` → `version = "X.Y.Z"`
    - `src/movie_narrator_web/__init__.py` → `__version__ = "X.Y.Z"`
    - `CHANGELOG.md` → 存在 `## [X.Y.Z]` 章节
  - 预期：三处均与发布版本一致

- [ ] **CHANGELOG 条目完整**
  - 核验：审阅 `CHANGELOG.md`
  - 预期：新版本章节使用 Keep a Changelog 类别
    （Added/Changed/Deprecated/Removed/Fixed/Security）；`[Unreleased]` 位于其上

---

## 发布准备

- [ ] **标签命名遵守约定**
  - 格式：`vX.Y.Z`（小写 `v`，semver，无前后缀）
  - 命令：`git tag -a vX.Y.Z -m "vX.Y.Z"`

- [ ] **发布分支已合并到 main**
  - 核验：release/feature 分支通过 PR 合并到 `main`
  - 预期：合并提交上所有 CI 检查通过
  - 说明：不直接推送到 `main`

- [ ] **标签已推送**
  - 命令：`git push origin vX.Y.Z`
  - 预期：标签出现在 GitHub；触发 `publish.yml` 工作流
  - 说明：标签与分支推送分开执行，以确保发布工作流可靠触发

- [ ] **PyPI 发布已核验**
  - 核验：`publish.yml` 目标（PyPI 或 TestPyPI）
  - 预期：`pypa/gh-action-pypi-publish` 通过可信发布成功

- [ ] **已创建 GitHub Release**
  - 核验：已为标签创建 Release 页面
  - 预期：标题 `vX.Y.Z`；正文由 CHANGELOG 章节生成；
    `prerelease` 标志与标签匹配（`-test` 后缀 → TestPyPI + prerelease）

---

## 发布后

- [ ] **已核验安装的 wheel**
  - 命令：`pip install movie-narrator-web==X.Y.Z`
  - 预期：包可正常安装；`mn-web --help` 可用

- [ ] **已更新 ROADMAP**
  - 核验：`ROADMAP.md` — 已发布版本移入 Completed 表；
    `CONTRACT_VERSION` 行反映当前最低契约

---

*每次发布均使用本清单。每个发布候选都应走完整个清单；通过全部项目的候选
即为正式发布版本。*