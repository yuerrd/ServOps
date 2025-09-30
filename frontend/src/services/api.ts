import axios from 'axios';
import { Project, ExecutionResult, SSHConnection } from '../types';

// 动态获取API基础URL，支持环境变量配置
const API_BASE_URL = (window as any).__RUNTIME_CONFIG__?.API_BASE_URL || '/api';

export const projectService = {
  // 获取所有项目（支持分页和搜索）
  async getProjects(page?: number, pageSize?: number, search?: string): Promise<{
    projects: Project[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);

    const response = await axios.get(`${API_BASE_URL}/projects?${params.toString()}`);
    return response.data;
  },

  // 根据ID获取单个项目
  async getProjectById(id: string): Promise<Project> {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}`);
    return response.data;
  },

  // 创建新项目
  async createProject(project: Omit<Project, 'id' | 'status'>): Promise<Project> {
    const response = await axios.post(`${API_BASE_URL}/projects`, project);
    return response.data;
  },

  // 更新项目
  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await axios.put(`${API_BASE_URL}/projects/${id}`, project);
    return response.data;
  },

  // 删除项目
  async deleteProject(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/projects/${id}`);
  },

  // 执行脚本
  async executeScript(projectId: string): Promise<{ executionId: string }> {
    const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/execute`);
    return response.data;
  },

  // 获取执行历史
  async getExecutionHistory(projectId: string): Promise<ExecutionResult[]> {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/history`);
    return response.data;
  },

  // 获取版本信息
  async getVersion(projectId: string): Promise<{ version: string }> {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/version`);
    return response.data;
  },

  // 获取脚本内容
  async getScriptContent(projectId: string): Promise<{ content: string }> {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/script`);
    return response.data;
  },

  // 更新脚本内容
  async updateScriptContent(projectId: string, content: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.put(`${API_BASE_URL}/projects/${projectId}/script`, { content });
    return response.data;
  },

  // 获取版本历史
  async getVersionHistory(projectId: string, page: number = 1, pageSize: number = 10): Promise<{
    items: Array<{ version: string; timestamp: string; success: boolean }>;
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/version-history`, {
      params: { page, pageSize }
    });
    return response.data;
  }
};

// SSH连接管理服务
export const sshService = {
  // 获取所有SSH连接
  async getAllConnections(): Promise<SSHConnection[]> {
    const response = await axios.get(`${API_BASE_URL}/ssh-connections`);
    return response.data;
  },

  // 创建SSH连接
  async createConnection(connection: Omit<SSHConnection, 'id'>): Promise<SSHConnection> {
    const response = await axios.post(`${API_BASE_URL}/ssh-connections`, connection);
    return response.data;
  },

  // 更新SSH连接
  async updateConnection(id: string, updates: Partial<SSHConnection>): Promise<SSHConnection> {
    const response = await axios.put(`${API_BASE_URL}/ssh-connections/${id}`, updates);
    return response.data;
  },

  // 删除SSH连接
  async deleteConnection(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/ssh-connections/${id}`);
  },

  // 测试连接
  async testConnection(connection: Partial<SSHConnection>): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(`${API_BASE_URL}/test-connection`, connection);
    return response.data;
  }
};

// 模板项目服务
export const templateService = {
  // 获取模板项目
  async getTemplates(): Promise<Project[]> {
    const response = await axios.get(`${API_BASE_URL}/templates`);
    return response.data;
  },

  // 基于模板创建项目
  async createProjectFromTemplate(templateId: string, projectData: Partial<Project>): Promise<Project> {
    const response = await axios.post(`${API_BASE_URL}/templates/${templateId}/create-project`, projectData);
    return response.data;
  }
};