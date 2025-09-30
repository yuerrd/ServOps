import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';

export function createProjectRoutes(projectController: ProjectController): Router {
  const router = Router();

  // 项目管理路由
  router.get('/projects', projectController.getAllProjects);
  router.get('/projects/:id', projectController.getProjectById);
  router.post('/projects', projectController.createProject);
  router.put('/projects/:id', projectController.updateProject);
  router.delete('/projects/:id', projectController.deleteProject);

  // 健康检查路由
  router.get('/health', projectController.healthCheck);

  // 脚本执行路由
  router.post('/projects/:id/execute', projectController.executeScript);
  router.get('/projects/:id/history', projectController.getExecutionHistory);
  router.get('/projects/:id/version', projectController.getVersion);

  // 脚本内容管理路由
  router.get('/projects/:id/script', projectController.getScriptContent);
  router.put('/projects/:id/script', projectController.updateScriptContent);
  router.get('/projects/:id/version-history', projectController.getVersionHistory);

  // SSH连接管理路由
  router.get('/ssh-connections', projectController.getAllSSHConnections);
  router.post('/ssh-connections', projectController.createSSHConnection);
  router.put('/ssh-connections/:id', projectController.updateSSHConnection);
  router.delete('/ssh-connections/:id', projectController.deleteSSHConnection);

  // 模板项目管理路由
  router.get('/templates', projectController.getTemplateProjects);
  router.post('/templates/:templateId/create-project', projectController.createProjectFromTemplate);

  // 连接测试路由
  router.post('/test-connection', projectController.testConnection);

  return router;
}