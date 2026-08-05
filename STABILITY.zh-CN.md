[![English](https://img.shields.io/badge/English-Stability-blue)](STABILITY.md)
[![简体中文](https://img.shields.io/badge/简体中文-稳定性承诺-green)](STABILITY.zh-CN.md)

# 稳定性承诺

本文档定义 `movie-narrator-web` 包的稳定性保证。

与核心引擎不同，`movie-narrator-web` **不**维护自己的公共 API 表面或
`CONTRACT_VERSION`。它是 `movie_narrator.contract` 的薄消费者，交付一个
FastAPI HTTP API 和一个打包的 React SPA。因此，下面的保证覆盖包对核心引擎
要求的**依赖契约**，以及面向用户暴露的 **HTTP API + 前端**表面。

## 核心依赖契约

`movie-narrator-web` 仅通过 `movie_narrator.contract` 消费核心引擎 — 不导入
内部模块。兼容性在导入时由 `check_version()` 强制保证。

- **最低契约**：`__init__.py` 中的 `_MIN_CONTRACT = (1, 0, 0)`。
- **依赖下限**：`pyproject.toml` 中的 `movie-narrator>=1.0.0`。
- **检查**：`from movie_narrator.contract import check_version; check_version((1, 0, 0))`

这两个值必须始终保持同步。如果包开始依赖更新的契约特性，运行时检查与依赖
下限会在同一次发布中一起提升（见 [ROADMAP.md](ROADMAP.md) 与
[CHANGELOG.md](CHANGELOG.md)）。

### 覆盖范围

- `_MIN_CONTRACT` 版本要求及其 `check_version()` 强制逻辑
- `pyproject.toml` 中的 `movie-narrator>=X.Y.Z` 依赖下限
- 单一导入边界：`movie_narrator_web` 从不导入核心内部模块
- 任务运行器使用的 `build_context` / `run_pipeline` 调用表面

### 不覆盖范围

- 核心引擎自身的 API 表面 — 同时持有两个包的客户应遵循核心引擎的
  [STABILITY.md](https://github.com/zcbacxc/movie-narrator/blob/main/docs/STABILITY.md)
- `movie_narrator_web` 的内部模块（form、tasks、ws、console）— 这些是实现
  细节，可能随时变更
- 未声明为稳定的默认参数值与高级表单字段
- 核心引擎流水线生成的输出文件格式

## HTTP API 稳定性

REST 与 WebSocket 端点是 Web UI 的操作边界。自 **v1.1.0** 起，以下内容在
1.x 系列内视为稳定：

- `POST /api/tasks` — 创建任务（表单字段，包括 `format`、`lang`、
  `narration_preset`）
- `GET /api/tasks/{id}` — 任务状态
- `DELETE /api/tasks/{id}` — 任务取消
- `GET /api/artifacts/{id}` — 产物下载
- `GET /api/video/{id}` — 视频流
- `GET /api/health` — 健康检查
- `WS /ws/task/{id}` — 进度流

### 字段命名说明

HTTP 表单字段名是 **`format`**（例如 `16:9` / `9:16`），与前端及 v1.0 之前的
核心引擎命名一致。包内部会将其映射为核心引擎的 `video_format` 参数。该
HTTP 字段名保持稳定，不会因前后端兼容而重命名。

## 版本策略

`movie-narrator-web` 遵循 [Semantic Versioning 2.0.0](https://semver.org/)。
`pyproject.toml` 中的版本与 `__init__.py` 中的 `__version__` 始终在同一次
发布中一起提升。

| 组件 | 含义 |
|-----------|---------|
| **MAJOR** | 对 HTTP API、前端行为或所需核心契约的破坏性变更。既有集成可能需要更新。 |
| **MINOR** | 以向后兼容方式新增功能。既有用法无需改动即可继续工作。 |
| **PATCH** | 缺陷修复、安全补丁与文档更新。无 API 或行为变更。 |

### 与核心契约的对齐

由于本包是核心契约的消费者，任何提升 `_MIN_CONTRACT` 或依赖下限的变更至少
属于 **MINOR** 提升 — 它改变了所需的核心引擎版本。会破坏既有 HTTP API 消费者
的变更则是 **MAJOR** 提升。

## Python 版本支持

`movie-narrator-web` 支持与其构建所依赖的核心引擎相同的 Python 版本：

| Python 版本 | 1.x 中是否支持 | 说明 |
|----------------|------------------|-------|
| 3.10           | 是              | 最低支持版本 |
| 3.11           | 是              | CI + 发布目标 |
| 3.12           | 是              | 在 CI 矩阵中测试 |
| 3.13           | 是              | 依赖核心引擎的 3.13 支持 |

始终同时支持至少 **3** 个 Python 小版本。新 Python 版本在核心引擎支持其后
的下一个小版本中添加。

## 弃用策略

当某个稳定 HTTP 字段或端点需要以破坏性方式移除或变更时，本包遵循先弃用后
移除的策略：

1. **弃用公告**：该特性在 **minor** 版本中标记为弃用。前端与文档同步更新，
   推荐替代方案。
2. **弃用窗口**：弃用的特性至少保留 **一个完整的 minor 版本周期**。
3. **移除**：该特性在下一个 **major** 版本中移除；在特殊情况下（安全漏洞、
   严重正确性缺陷）可能提前移除。

## 升级保证

### 同一主版本内（1.x）

- 对 HTTP API、前端用法或所需核心契约下限 **零破坏性变更**。
- **新特性是增量的**：新表单字段、端点、视图在 minor 版本中添加，不影响既有用法。
- **缺陷修复是安全的**：patch 版本修复缺陷而不改变已记录的行为。若修复改变了
  可观察行为，则作为带迁移说明的 minor 版本处理。

### 主版本之间

- 允许且预期出现破坏性变更。
- 所有破坏性变更记录在 `CHANGELOG.md` 的相应类别下，并附升级指导。
- 上一个主版本在新主版本发布后至少享受 **6 个月** 的安全与关键缺陷修复支持。

---

*本稳定性策略自 v1.1.0 起生效。如有 API 稳定性或弃用时间线相关问题，请在
GitHub 上提交 issue。*