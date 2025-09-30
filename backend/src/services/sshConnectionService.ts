import { v4 as uuidv4 } from 'uuid';
import { SSHConnection } from '../types';
import { DatabaseService } from './databaseService';

export class SSHConnectionService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  async getAllConnections(): Promise<SSHConnection[]> {
    try {
      const query = `
        SELECT id, name, host, port, username, password, private_key, passphrase, description,
               created_at, updated_at
        FROM ssh_connections 
        ORDER BY created_at DESC
      `;
      const rows = await this.db.executeQuery<any>(query);
      
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        host: row.host,
        port: row.port,
        username: row.username,
        password: row.password,
        privateKey: row.private_key,
        passphrase: row.passphrase,
        description: row.description
      }));
    } catch (error) {
      console.error('获取SSH连接列表失败:', error);
      return [];
    }
  }

  async getConnectionById(id: string): Promise<SSHConnection | null> {
    try {
      const query = `
        SELECT id, name, host, port, username, password, private_key, passphrase, description
        FROM ssh_connections 
        WHERE id = ?
      `;
      const rows = await this.db.executeQuery<any>(query, [id]);
      
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        host: row.host,
        port: row.port,
        username: row.username,
        password: row.password,
        privateKey: row.private_key,
        passphrase: row.passphrase,
        description: row.description
      };
    } catch (error) {
      console.error('获取SSH连接失败:', error);
      return null;
    }
  }

  async createConnection(connectionData: Omit<SSHConnection, 'id'>): Promise<SSHConnection> {
    const id = uuidv4();
    
    try {
      const query = `
        INSERT INTO ssh_connections (id, name, host, port, username, password, private_key, passphrase, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.db.executeQuery(query, [
        id,
        connectionData.name,
        connectionData.host,
        connectionData.port,
        connectionData.username,
        connectionData.password || null,
        connectionData.privateKey || null,
        connectionData.passphrase || null,
        connectionData.description || null
      ]);

      return { id, ...connectionData };
    } catch (error) {
      console.error('创建SSH连接失败:', error);
      throw error;
    }
  }

  async updateConnection(id: string, updates: Partial<SSHConnection>): Promise<SSHConnection | null> {
    try {
      // 构建动态更新查询
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.host !== undefined) {
        updateFields.push('host = ?');
        updateValues.push(updates.host);
      }
      if (updates.port !== undefined) {
        updateFields.push('port = ?');
        updateValues.push(updates.port);
      }
      if (updates.username !== undefined) {
        updateFields.push('username = ?');
        updateValues.push(updates.username);
      }
      if (updates.password !== undefined) {
        updateFields.push('password = ?');
        updateValues.push(updates.password);
      }
      if (updates.privateKey !== undefined) {
        updateFields.push('private_key = ?');
        updateValues.push(updates.privateKey);
      }
      if (updates.passphrase !== undefined) {
        updateFields.push('passphrase = ?');
        updateValues.push(updates.passphrase);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description);
      }

      if (updateFields.length === 0) {
        return await this.getConnectionById(id);
      }

      updateValues.push(id);

      const query = `
        UPDATE ssh_connections 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await this.db.executeQuery(query, updateValues);
      return await this.getConnectionById(id);
    } catch (error) {
      console.error('更新SSH连接失败:', error);
      return null;
    }
  }

  async deleteConnection(id: string): Promise<boolean> {
    try {
      // 检查是否有项目使用此连接
      const projectQuery = 'SELECT COUNT(*) as count FROM projects WHERE ssh_connection_id = ?';
      const projectRows = await this.db.executeQuery<any>(projectQuery, [id]);
      
      if (projectRows[0].count > 0) {
        throw new Error('无法删除：仍有项目使用此SSH连接');
      }

      const query = 'DELETE FROM ssh_connections WHERE id = ?';
      await this.db.executeQuery(query, [id]);
      return true;
    } catch (error) {
      console.error('删除SSH连接失败:', error);
      return false;
    }
  }
}