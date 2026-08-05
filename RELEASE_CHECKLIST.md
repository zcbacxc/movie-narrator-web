[![English](https://img.shields.io/badge/English-Release_Checklist-blue)](RELEASE_CHECKLIST.md)
[![简体中文](https://img.shields.io/badge/简体中文-发布清单-green)](RELEASE_CHECKLIST.zh-CN.md)

# Release Checklist

> **Definition of Done for a `movie-narrator-web` release.** Every item must be
> verified and checked off before the version tag is created and the release is
> published to PyPI. Items are grouped by category; each has a verification
> command or method.

---

## Code Quality

- [ ] **Frontend type-check passes**
  - Command: `cd webui && npx tsc --noEmit`
  - Expected: No type errors

- [ ] **Backend imports cleanly**
  - Command: `python -c "import movie_narrator_web; print(movie_narrator_web.__version__)"`
  - Expected: Prints the release version, no `ImportError`

- [ ] **Contract check passes at import time**
  - Command: same as above
  - Expected: No `ImportError` from `check_version()` — the installed core
    engine meets `_MIN_CONTRACT`

---

## Testing

- [ ] **Web package tests all pass**
  - Command: `pytest tests/ -v`
  - Expected: `XX passed` (0 failed, 0 errors)
  - Note: Covers `test_web_form.py`, `test_controller.py`, `test_web_api.py`

- [ ] **Core engine contract satisfied**
  - Command: `python -c "from movie_narrator.contract import CONTRACT_VERSION; print(CONTRACT_VERSION)"`
  - Expected: `(1, 0, 0)` or newer — meets the dependency floor

- [ ] **CI matrix passes**
  - Verification: GitHub Actions `ci.yml`
  - Expected: `frontend` build + `web-tests` matrix (Python 3.10–3.13) all green
  - Note: CI installs the core engine from `main` via `pip install git+...`

- [ ] **No flaky failures**
  - Command: `pytest tests/ -v` run twice
  - Expected: Same results on both runs

---

## Build & Packaging

- [ ] **Frontend SPA builds**
  - Command: `cd webui && npm ci && npm run build`
  - Expected: Output lands in `src/movie_narrator_web/static/` with `index.html`
    plus hashed `.js` / `.css` assets

- [ ] **Wheel ships the SPA**
  - Command: `python -m build && twine check dist/*`
  - Expected: `twine check` passes; the wheel contains
    `movie_narrator_web/static/index.html` and assets (verified by the publish
    workflow)

- [ ] **Version sources are aligned**
  - Verification:
    - `pyproject.toml` → `version = "X.Y.Z"`
    - `src/movie_narrator_web/__init__.py` → `__version__ = "X.Y.Z"`
    - `CHANGELOG.md` → a `## [X.Y.Z]` section exists
  - Expected: all three match the release version

- [ ] **CHANGELOG entry is complete**
  - Verification: Review `CHANGELOG.md`
  - Expected: New version section uses Keep a Changelog categories
    (Added/Changed/Deprecated/Removed/Fixed/Security); `[Unreleased]` is above it

---

## Release Preparation

- [ ] **Tag naming follows convention**
  - Format: `vX.Y.Z` (lowercase `v`, semver, no prefix/suffix)
  - Command: `git tag -a vX.Y.Z -m "vX.Y.Z"`

- [ ] **Release branch is merged to main**
  - Verification: release/feature branch merged into `main` via PR
  - Expected: All CI checks pass on the merge commit
  - Note: No direct pushes to `main`

- [ ] **Tag pushed**
  - Command: `git push origin vX.Y.Z`
  - Expected: Tag appears on GitHub; the `publish.yml` workflow triggers
  - Note: Push the tag separately from branch pushes so the publish workflow
    fires reliably

- [ ] **PyPI publish verified**
  - Verification: `publish.yml` target (PyPI or TestPyPI)
  - Expected: `pypa/gh-action-pypi-publish` succeeds via trusted publishing

- [ ] **GitHub Release created**
  - Verification: Release page created with the tag
  - Expected: Title `vX.Y.Z`; body generated from the CHANGELOG section;
    `prerelease` flag matches the tag (`-test` suffix → TestPyPI + prerelease)

---

## Post-Release

- [ ] **Installed wheel verified**
  - Command: `pip install movie-narrator-web==X.Y.Z`
  - Expected: Package installs cleanly; `mn-web --help` works

- [ ] **ROADMAP updated**
  - Verification: `ROADMAP.md` — the released version moved to the Completed
    table; `CONTRACT_VERSION` line reflects the current minimum contract

---

*Use this checklist for every release. Each release candidate should go
through the full checklist; the release that passes all items becomes the
published version.*