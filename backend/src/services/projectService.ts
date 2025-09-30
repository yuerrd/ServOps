import { v4 as uuidv4 } from 'uuid';
import { Project, ExecutionResult, SSHConnection } from '../types';
import { SSHConnectionService } from './sshConnectionService';
import { DatabaseService } from './databaseService';

export class ProjectService {
  private db: DatabaseService;
  private sshConnectionService: SSHConnectionService;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.sshConnectionService = new SSHConnectionService();
  }

  async getAllProjects(page?: number, pageSize?: number, searchTerm?: string): Promise<{
    projects: Project[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      // 构建查询条件
      let whereClause = '';
      let queryParams: any[] = [];
      
      if (searchTerm && searchTerm.trim()) {
        whereClause = 'WHERE name LIKE ? OR description LIKE ?';
        const searchPattern = `%${searchTerm.trim()}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      // 计算总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM projects 
        ${whereClause}
      `;
      const countResult = await this.db.executeQuery<any>(countQuery, queryParams);
      const total = countResult[0].total;

      // 构建分页查询（移除version_file_path字段）
      const currentPage = page || 1;
      const currentPageSize = pageSize || 10;
      const offset = (currentPage - 1) * currentPageSize;

      const dataQuery = `
        SELECT id, name, description, ssh_connection_id, working_directory, 
               script_content, current_version, is_template, 
               status, last_run, created_at, updated_at
        FROM projects 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const dataParams = [...queryParams, currentPageSize, offset];
      const rows = await this.db.executeQuery<any>(dataQuery, dataParams);
      
      const projects = rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        sshConnectionId: row.ssh_connection_id,
        workingDirectory: row.working_directory,
        scriptContent: row.script_content,
        currentVersion: row.current_version,
        isTemplate: Boolean(row.is_template),
        status: row.status,
        lastRun: row.last_run
      }));

      return {
        projects,
        total,
        page: currentPage,
        pageSize: currentPageSize
      };
    } catch (error) {
      console.error('获取项目列表失败:', error);
      return {
        projects: [],
        total: 0,
        page: page || 1,
        pageSize: pageSize || 10
      };
    }
  }

  async getProjectById(id: string): Promise<Project | null> {
    try {
      console.log(`🔍 [ProjectService] 查询项目ID: ${id}`);
      
      const query = `
        SELECT id, name, description, ssh_connection_id, working_directory, 
               script_content, current_version, is_template, 
               status, last_run
        FROM projects 
        WHERE id = ?
      `;
      const rows = await this.db.executeQuery<any>(query, [id]);
      
      console.log(`🔍 [ProjectService] 数据库查询结果: 找到 ${rows.length} 条记录`);
      
      if (rows.length === 0) {
        console.log(`❌ [ProjectService] 项目不存在 - ID: ${id}`);
        return null;
      }
      
      const row = rows[0];
      console.log(`✅ [ProjectService] 找到项目: ${row.name} (ID: ${row.id})`);
      
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        sshConnectionId: row.ssh_connection_id,
        workingDirectory: row.working_directory,
        scriptContent: row.script_content,
        currentVersion: row.current_version,
        isTemplate: Boolean(row.is_template),
        status: row.status,
        lastRun: row.last_run
      };
    } catch (error) {
      console.error('❌ [ProjectService] 获取项目详情失败:', error);
      return null;
    }
  }

  async createProject(projectData: Omit<Project, 'id' | 'status'>): Promise<Project> {
    const id = uuidv4();
    
    try {
      const query = `
        INSERT INTO projects (id, name, description, ssh_connection_id, working_directory,
                            script_content, current_version, is_template, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'idle')
      `;
      
      await this.db.executeQuery(query, [
        id,
        projectData.name,
        projectData.description || null,
        projectData.sshConnectionId,
        projectData.workingDirectory,
        projectData.scriptContent,
        projectData.currentVersion,
        projectData.isTemplate
      ]);

      return { id, status: 'idle' as const, ...projectData };
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      // 构建动态更新查询
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description);
      }
      if (updates.sshConnectionId !== undefined) {
        updateFields.push('ssh_connection_id = ?');
        updateValues.push(updates.sshConnectionId);
      }
      if (updates.workingDirectory !== undefined) {
        updateFields.push('working_directory = ?');
        updateValues.push(updates.workingDirectory);
      }
      if (updates.scriptContent !== undefined) {
        updateFields.push('script_content = ?');
        updateValues.push(updates.scriptContent);
      }
      if (updates.currentVersion !== undefined) {
        updateFields.push('current_version = ?');
        updateValues.push(updates.currentVersion);
      }
      if (updates.isTemplate !== undefined) {
        updateFields.push('is_template = ?');
        updateValues.push(updates.isTemplate);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }
      if (updates.lastRun !== undefined) {
        updateFields.push('last_run = ?');
        updateValues.push(updates.lastRun);
      }

      if (updateFields.length === 0) {
        return await this.getProjectById(id);
      }

      updateValues.push(id);

      const query = `
        UPDATE projects 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await this.db.executeQuery(query, updateValues);
      return await this.getProjectById(id);
    } catch (error) {
      console.error('更新项目失败:', error);
      return null;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      // 使用事务删除项目及其相关数据
      return await this.db.executeTransaction(async (connection) => {
        // 删除执行日志
        await connection.execute(
          'DELETE el FROM execution_logs el INNER JOIN execution_results er ON el.execution_id = er.id WHERE er.project_id = ?',
          [id]
        );
        
        // 删除执行结果
        await connection.execute('DELETE FROM execution_results WHERE project_id = ?', [id]);
        
        // 删除项目
        await connection.execute('DELETE FROM projects WHERE id = ?', [id]);
        
        return true;
      });
    } catch (error) {
      console.error('删除项目失败:', error);
      return false;
    }
  }

  async updateProjectStatus(id: string, status: Project['status'], lastRun?: Date): Promise<void> {
    try {
      const query = `
        UPDATE projects 
        SET status = ?, last_run = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await this.db.executeQuery(query, [status, lastRun || null, id]);
    } catch (error) {
      console.error('更新项目状态失败:', error);
    }
  }

  async addExecutionResult(result: ExecutionResult): Promise<void> {
    try {
      const executionId = uuidv4();
      
      await this.db.executeTransaction(async (connection) => {
        // 插入执行结果
        await connection.execute(
          'INSERT INTO execution_results (id, project_id, success, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
          [executionId, result.projectId, result.success, result.startTime, result.endTime || null]
        );
        
        // 插入执行日志
        for (const log of result.logs) {
          await connection.execute(
            'INSERT INTO execution_logs (execution_id, timestamp, message, type) VALUES (?, ?, ?, ?)',
            [executionId, log.timestamp, log.message, log.type]
          );
        }
      });
    } catch (error) {
      console.error('保存执行结果失败:', error);
    }
  }

  async getExecutionHistory(projectId: string): Promise<ExecutionResult[]> {
    try {
      const query = `
        SELECT er.id, er.project_id, er.success, er.start_time, er.end_time,
               el.timestamp as log_timestamp, el.message as log_message, el.type as log_type
        FROM execution_results er
        LEFT JOIN execution_logs el ON er.id = el.execution_id
        WHERE er.project_id = ?
        ORDER BY er.start_time DESC, el.timestamp ASC
        LIMIT 1000
      `;
      
      const rows = await this.db.executeQuery<any>(query, [projectId]);
      
      // 将结果按执行ID分组
      const executionMap = new Map<string, ExecutionResult>();
      
      rows.forEach(row => {
        if (!executionMap.has(row.id)) {
          executionMap.set(row.id, {
            projectId: row.project_id,
            success: Boolean(row.success),
            startTime: row.start_time,
            endTime: row.end_time,
            logs: []
          });
        }
        
        if (row.log_timestamp) {
          executionMap.get(row.id)!.logs.push({
            timestamp: row.log_timestamp,
            message: row.log_message,
            type: row.log_type
          });
        }
      });
      
      return Array.from(executionMap.values()).slice(0, 20); // 最多返回20条记录
    } catch (error) {
      console.error('获取执行历史失败:', error);
      return [];
    }
  }

  async getProjectsCount(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM projects';
      const rows = await this.db.executeQuery<any>(query);
      return rows[0].count;
    } catch (error) {
      console.error('获取项目数量失败:', error);
      return 0;
    }
  }

  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    try {
      const query = `
        SELECT id, name, description, ssh_connection_id, working_directory, 
               script_content, current_version, is_template, 
               status, last_run
        FROM projects 
        WHERE status = ?
        ORDER BY created_at DESC
      `;
      const rows = await this.db.executeQuery<any>(query, [status]);
      
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        sshConnectionId: row.ssh_connection_id,
        workingDirectory: row.working_directory,
        scriptContent: row.script_content,
        currentVersion: row.current_version,
        isTemplate: Boolean(row.is_template),
        status: row.status,
        lastRun: row.last_run
      }));
    } catch (error) {
      console.error('按状态获取项目失败:', error);
      return [];
    }
  }

  // 获取SSH连接服务
  getSSHConnectionService(): SSHConnectionService {
    return this.sshConnectionService;
  }

  // 根据项目获取SSH配置
  async getSSHConfigForProject(projectId: string): Promise<SSHConnection | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;
    
    return await this.sshConnectionService.getConnectionById(project.sshConnectionId);
  }

  // 更新项目版本
  async updateProjectVersion(projectId: string, newVersion: string): Promise<void> {
    await this.updateProject(projectId, { currentVersion: newVersion });
  }

  // 添加版本历史记录
  async addVersionHistory(projectId: string, version: string, success: boolean): Promise<void> {
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO version_history (id, project_id, version, success)
        VALUES (?, ?, ?, ?)
      `;
      
      await this.db.executeQuery(query, [id, projectId, version, success]);
      console.log(`✅ 记录版本历史: ${version} (${success ? '成功' : '失败'})`);
    } catch (error) {
      console.error('添加版本历史失败:', error);
    }
  }

  // 获取版本历史
  async getVersionHistory(projectId: string, page: number = 1, pageSize: number = 10): Promise<{
    items: Array<{ version: string; timestamp: string; success: boolean }>;
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    try {
      // 先获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM version_history 
        WHERE project_id = ?
      `;
      const countResult = await this.db.executeQuery<any>(countQuery, [projectId]);
      const total = countResult[0].total;

      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const query = `
        SELECT version, success, created_at
        FROM version_history 
        WHERE project_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const rows = await this.db.executeQuery<any>(query, [projectId, pageSize, offset]);
      
      const items = rows.map(row => ({
        version: row.version,
        timestamp: row.created_at,
        success: Boolean(row.success)
      }));

      const hasMore = (page * pageSize) < total;

      return {
        items,
        total,
        page,
        pageSize,
        hasMore
      };
    } catch (error) {
      console.error('获取版本历史失败:', error);
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        hasMore: false
      };
    }
  }

  // 获取模板项目
  async getTemplateProjects(): Promise<Project[]> {
    try {
      const query = `
        SELECT id, name, description, ssh_connection_id, working_directory, 
               script_content, current_version, is_template, 
               status, last_run
        FROM projects 
        WHERE is_template = true
        ORDER BY created_at DESC
      `;
      const rows = await this.db.executeQuery<any>(query);
      
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        sshConnectionId: row.ssh_connection_id,
        workingDirectory: row.working_directory,
        scriptContent: row.script_content,
        currentVersion: row.current_version,
        isTemplate: Boolean(row.is_template),
        status: row.status,
        lastRun: row.last_run
      }));
    } catch (error) {
      console.error('获取模板项目失败:', error);
      return [];
    }
  }

  // 基于模板创建项目
  async createProjectFromTemplate(templateId: string, projectData: Partial<Project>): Promise<Project | null> {
    const template = await this.getProjectById(templateId);
    if (!template || !template.isTemplate) {
      return null;
    }

    const newProjectData: Omit<Project, 'id' | 'status'> = {
      name: projectData.name || `${template.name} - 副本`,
      description: projectData.description || template.description,
      sshConnectionId: projectData.sshConnectionId || template.sshConnectionId,
      workingDirectory: template.workingDirectory,
      scriptContent: template.scriptContent,
      currentVersion: projectData.currentVersion || '0.0.1',
      isTemplate: false,
      lastRun: undefined
    };

    return await this.createProject(newProjectData);
  }
}