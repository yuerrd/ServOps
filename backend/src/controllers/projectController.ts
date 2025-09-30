import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { SSHService } from '../services/sshService';
import { ExecutionService } from '../services/executionService';
import { Project, SSHConfig, SSHConnection } from '../types';

export class ProjectController {
  private projectService: ProjectService;
  private executionService: ExecutionService;

  constructor(projectService: ProjectService, executionService: ExecutionService) {
    this.projectService = projectService;
    this.executionService = executionService;
  }

  // 获取所有项目
  getAllProjects = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const searchTerm = req.query.search as string || '';

      const result = await this.projectService.getAllProjects(page, pageSize, searchTerm);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取项目列表失败' });
    }
  };

  // 根据ID获取单个项目
  getProjectById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: '项目不存在' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: '获取项目信息失败' });
    }
  };

  // 创建新项目
  createProject = async (req: Request, res: Response) => {
    try {
      const projectData = req.body;
      const project = await this.projectService.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: '创建项目失败' });
    }
  };

  // 更新项目
  updateProject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const project = await this.projectService.updateProject(id, updates);
      
      if (!project) {
        return res.status(404).json({ error: '项目不存在' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: '更新项目失败' });
    }
  };

  // 删除项目
  deleteProject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.projectService.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ error: '项目不存在' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: '删除项目失败' });
    }
  };

  // 执行脚本
  executeScript = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log(`🔍 [执行脚本] 收到项目ID: ${id}`);
      
      // 验证项目ID格式
      if (!id || id.trim() === '') {
        console.log(`❌ [执行脚本] 项目ID为空`);
        return res.status(400).json({ error: '项目ID不能为空' });
      }

      const project = await this.projectService.getProjectById(id);
      console.log(`🔍 [执行脚本] 查询项目结果:`, project ? `找到项目: ${project.name}` : '项目不存在');
      
      if (!project) {
        console.log(`❌ [执行脚本] 项目不存在 - ID: ${id}`);
        return res.status(404).json({ error: `项目不存在 (ID: ${id})` });
      }

      if (project.status === 'running') {
        console.log(`⚠️ [执行脚本] 项目正在运行中 - ${project.name}`);
        return res.status(400).json({ error: '项目正在执行中' });
      }

      console.log(`✅ [执行脚本] 开始执行项目: ${project.name}`);
      const executionId = await this.executionService.executeScript(project);
      
      console.log(`✅ [执行脚本] 执行ID: ${executionId}`);
      res.json({ executionId });
    } catch (error) {
      console.error(`❌ [执行脚本] 执行失败:`, error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : '执行脚本失败' 
      });
    }
  };

  // 获取执行历史
  getExecutionHistory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const history = await this.projectService.getExecutionHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: '获取执行历史失败' });
    }
  };

  // 测试连接
  testConnection = async (req: Request, res: Response) => {
    try {
      const { host, port, username, password, privateKey, passphrase } = req.body;
      
      const sshConfig: SSHConfig = {
        host,
        port,
        username,
        password,
        privateKey,
        passphrase
      };

      const sshService = new SSHService();
      const result = await sshService.testConnection(sshConfig);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : '连接测试失败' 
      });
    }
  };

  // 获取版本信息
  getVersion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: '项目不存在' });
      }

      // 返回项目当前版本信息
      const version = project.currentVersion || '未设置版本';
      res.json({ version });
    } catch (error) {
      res.status(500).json({ version: '获取版本失败' });
    }
  };

  // 获取脚本内容
  getScriptContent = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: '项目不存在' });
      }

      // 直接返回平台存储的脚本内容
      res.json({ content: project.scriptContent || '' });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : '获取脚本内容失败' 
      });
    }
  };

  // 更新脚本内容
  updateScriptContent = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const project = await this.projectService.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: '项目不存在' });
      }

      // 直接更新项目的脚本内容
      await this.projectService.updateProject(id, { scriptContent: content });

      res.json({ success: true, message: '脚本内容更新成功' });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : '更新脚本内容失败' 
      });
    }
  };

  // 获取版本历史
  getVersionHistory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      const project = await this.projectService.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: '项目不存在' });
      }

      // 从版本历史表获取分页数据
      const result = await this.projectService.getVersionHistory(id, page, pageSize);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取版本历史失败' });
    }
  };

  // SSH连接管理相关方法
  getAllSSHConnections = async (req: Request, res: Response) => {
    try {
      const connections = await this.projectService.getSSHConnectionService().getAllConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: '获取SSH连接列表失败' });
    }
  };

  createSSHConnection = async (req: Request, res: Response) => {
    try {
      const connectionData = req.body;
      const connection = await this.projectService.getSSHConnectionService().createConnection(connectionData);
      res.status(201).json(connection);
    } catch (error) {
      res.status(400).json({ error: '创建SSH连接失败' });
    }
  };

  updateSSHConnection = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const connection = await this.projectService.getSSHConnectionService().updateConnection(id, updates);
      
      if (!connection) {
        return res.status(404).json({ error: 'SSH连接不存在' });
      }
      
      res.json(connection);
    } catch (error) {
      res.status(400).json({ error: '更新SSH连接失败' });
    }
  };

  deleteSSHConnection = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.projectService.getSSHConnectionService().deleteConnection(id);
      
      if (!success) {
        return res.status(404).json({ error: 'SSH连接不存在' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: '删除SSH连接失败' });
    }
  };

  // 健康检查端点
  healthCheck = async (req: Request, res: Response) => {
    try {
      // 检查数据库连接
      await this.projectService.getProjectsCount();
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ServOps Backend',
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Service unavailable'
      });
    }
  };

  // 获取模板项目
  getTemplateProjects = async (req: Request, res: Response) => {
    try {
      const templates = await this.projectService.getTemplateProjects();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: '获取模板项目失败' });
    }
  };

  // 基于模板创建项目
  createProjectFromTemplate = async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params;
      const projectData = req.body;
      const project = await this.projectService.createProjectFromTemplate(templateId, projectData);
      
      if (!project) {
        return res.status(404).json({ error: '模板不存在或无效' });
      }
      
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: '基于模板创建项目失败' });
    }
  };
}