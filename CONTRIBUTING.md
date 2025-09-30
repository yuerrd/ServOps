# 贡献指南

感谢您对 ServOps 项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 🐛 报告和修复 bug
- ✨ 提出和实现新功能
- 📚 改进文档
- 🧪 编写测试
- 💡 提出改进建议

## 🚀 快速开始

### 1. Fork 和 Clone

```bash
# Fork 仓库到您的 GitHub 账户
# 然后 clone 到本地
git clone https://github.com/your-username/ServOps.git
cd ServOps

# 添加上游仓库
git remote add upstream https://github.com/yuerrd/ServOps.git
```

### 2. 设置开发环境

```bash
# 安装依赖
npm run install:all

# 启动开发服务器
npm run dev
```

### 3. 创建分支

```bash
# 创建新的功能分支
git checkout -b feature/your-feature-name

# 或者修复 bug 的分支
git checkout -b fix/issue-number
```

## 🔧 开发规范

### 代码风格

- **TypeScript**: 项目使用 TypeScript，请确保类型安全
- **ESLint**: 遵循项目的 ESLint 配置
- **Prettier**: 使用 Prettier 进行代码格式化

```bash
# 检查代码风格
npm run lint

# 自动修复格式问题
npm run lint -- --fix
```

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**类型 (type):**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式修改（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例:**
```bash
feat(frontend): 添加项目模板功能
fix(backend): 修复SSH连接超时问题
docs(readme): 更新安装说明
```

### 分支策略

- `main`: 主分支，包含稳定的生产代码
- `develop`: 开发分支，包含最新的开发代码
- `feature/*`: 功能分支
- `fix/*`: 修复分支
- `release/*`: 发布分支

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 只运行前端测试
npm run test:frontend

# 只运行后端测试
npm run test:backend
```

### 编写测试

- 为新功能编写单元测试
- 确保测试覆盖率不低于现有水平
- 使用描述性的测试名称

## 📝 文档

### API 文档

如果您添加或修改了 API 接口，请更新相关文档：

- 更新 README.md 中的 API 表格
- 在代码中添加 JSDoc 注释
- 提供使用示例

### 用户文档

- 新功能需要在 README.md 中添加使用说明
- 更新相关的配置说明
- 添加必要的截图或示例

## 🔍 Pull Request 流程

### 1. 提交前检查

```bash
# 确保代码通过所有检查
npm run lint
npm test
npm run build

# 确保与上游同步
git fetch upstream
git rebase upstream/main
```

### 2. 创建 Pull Request

- 使用清晰的标题描述更改
- 在描述中详细说明：
  - 解决了什么问题
  - 如何解决的
  - 是否包含破坏性更改
  - 测试说明

### 3. PR 模板

```markdown
## 📋 更改摘要
<!-- 简要描述此 PR 的更改内容 -->

## 🔍 更改类型
- [ ] 新功能 (feature)
- [ ] 修复 bug (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试相关 (test)

## 🧪 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

## 📚 文档
- [ ] 更新了相关文档
- [ ] 添加了代码注释
- [ ] 更新了 README（如需要）

## 🔗 相关 Issue
<!-- 如果解决了某个 issue，请链接它 -->
Closes #issue_number

## 📸 截图
<!-- 如果是 UI 相关更改，请提供截图 -->

## 📝 其他说明
<!-- 任何其他需要说明的内容 -->
```

## 🐛 报告 Bug

### 使用 Issue 模板

请使用以下模板报告 bug：

```markdown
**🐛 Bug 描述**
简要描述 bug 的现象

**🔄 重现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**✅ 期望行为**
描述您期望发生什么

**📸 截图**
如果适用，请添加截图来帮助解释问题

**💻 环境信息**
- OS: [例如 Windows 10, macOS 12.0]
- Browser: [例如 Chrome 96, Safari 15]
- Node.js Version: [例如 16.14.0]
- npm Version: [例如 8.3.1]

**📝 其他信息**
添加任何其他关于问题的信息
```

## 🚀 功能请求

### 使用 Issue 模板

```markdown
**✨ 功能描述**
清楚地描述您希望看到的功能

**💡 动机**
为什么需要这个功能？它解决什么问题？

**📋 详细方案**
详细描述您希望如何实现这个功能

**🤔 考虑的替代方案**
描述您考虑过的其他解决方案

**📝 其他信息**
添加任何其他关于功能请求的信息
```

## 🎯 开发重点

### 当前优先级

1. **安全性**: SSH 连接安全、数据加密
2. **性能**: 大量数据处理、实时日志传输
3. **用户体验**: 界面响应性、错误处理
4. **测试覆盖**: 单元测试、集成测试

### 需要帮助的领域

- [ ] 用户认证和权限管理
- [ ] 移动端适配优化
- [ ] 国际化支持
- [ ] 性能监控和优化
- [ ] 文档完善

## 💬 交流

- **GitHub Discussions**: 技术讨论和问答
- **GitHub Issues**: Bug 报告和功能请求
- **Code Review**: PR 评审和建议

## 📜 行为准则

我们致力于为所有人提供一个友好、安全和欢迎的环境，无论性别、性取向、能力、种族、社会经济地位和宗教（或缺乏宗教）。

### 预期行为

- 使用友好和包容的语言
- 尊重不同的观点和经历
- 优雅地接受建设性批评
- 专注于对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 恶意评论、侮辱或人身攻击
- 公开或私人骚扰
- 发布他人的私人信息
- 其他在专业环境中被认为不合适的行为

感谢您的贡献！🎉