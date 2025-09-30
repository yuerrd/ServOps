import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { ProjectService } from './services/projectService';
import { ExecutionService } from './services/executionService';
import { ProjectController } from './controllers/projectController';
import { createProjectRoutes } from './routes/projectRoutes';
import { DatabaseService } from './services/databaseService';

// 加载环境变量
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 启动函数
async function startServer() {
  try {
    // 初始化数据库连接
    const db = DatabaseService.getInstance();
    const isDbConnected = await db.testConnection();
    
    if (!isDbConnected) {
      console.error('❌ 无法连接到MySQL数据库，请检查配置');
      process.exit(1);
    }
    
    // 创建服务实例
    const projectService = new ProjectService();
    const executionService = new ExecutionService(projectService, io);
    const projectController = new ProjectController(projectService, executionService);

    // API 路由
    app.use('/api', createProjectRoutes(projectController));

    // 健康检查
    app.get('/health', async (req, res) => {
      const projectCount = await projectService.getProjectsCount();
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        projects: projectCount,
        database: 'mysql'
      });
    });

    // Socket.IO 连接处理
    io.on('connection', (socket) => {
      console.log('客户端连接:', socket.id);

      // 加入项目房间
      socket.on('join-project', (projectId: string) => {
        socket.join(projectId);
        console.log(`客户端 ${socket.id} 加入项目房间: ${projectId}`);
      });

      // 离开项目房间
      socket.on('leave-project', (projectId: string) => {
        socket.leave(projectId);
        console.log(`客户端 ${socket.id} 离开项目房间: ${projectId}`);
      });

      socket.on('disconnect', () => {
        console.log('客户端断开连接:', socket.id);
      });
    });

    // 错误处理中间件
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('服务器错误:', err);
      res.status(500).json({ error: '服务器内部错误' });
    });

    // 404 处理
    app.use((req, res) => {
      res.status(404).json({ error: '接口不存在' });
    });

    // 启动服务器
    httpServer.listen(PORT, () => {
      console.log(`🚀 ServOps 后端服务启动成功`);
      console.log(`📡 HTTP 服务: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket 服务: ws://localhost:${PORT}`);
      console.log(`🗄️ 数据库: MySQL (${process.env.DB_HOST}:${process.env.DB_PORT})`);
      console.log('===============================');
    });

  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
async function gracefulShutdown(signal: string) {
  console.log(`收到 ${signal} 信号，正在关闭服务器...`);
  
  try {
    httpServer.close(() => {
      console.log('HTTP服务器已关闭');
    });
    
    // 关闭数据库连接
    const db = DatabaseService.getInstance();
    await db.close();
    console.log('数据库连接已关闭');
    
    process.exit(0);
  } catch (error) {
    console.error('关闭服务时出错:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 启动服务
startServer();