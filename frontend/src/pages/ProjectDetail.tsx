import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Row, 
  Col, 
  Descriptions,
  message,
  Spin,
  Progress,
  Alert,
  Input,
  Tabs,
  Timeline
} from 'antd';
import { 
  PlayCircleOutlined, 
  ArrowLeftOutlined, 
  ReloadOutlined,
  ClearOutlined,
  WifiOutlined,
  DisconnectOutlined,
  EditOutlined,
  SaveOutlined,
  HistoryOutlined,
  FileTextOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { io, Socket } from 'socket.io-client';
import { Project, LogEntry, SSHConnection } from '../types';
import { projectService, sshService } from '../services/api';

const { Title, Text } = Typography;

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [sshConnection, setSshConnection] = useState<SSHConnection | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [lastLogTime, setLastLogTime] = useState<Date | null>(null);
  
  // 新增状态用于脚本和版本管理
  const [scriptContent, setScriptContent] = useState<string>('');
  const [versionHistory, setVersionHistory] = useState<Array<{ version: string; timestamp: string; success: boolean }>>([]);
  const [editingScript, setEditingScript] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('logs');
  
  // 版本历史分页相关状态
  const [versionPage, setVersionPage] = useState(1);
  const [versionPageSize] = useState(10);
  const [versionTotal, setVersionTotal] = useState(0);
  const [versionHasMore, setVersionHasMore] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const executionStartTime = useRef<Date | null>(null);

  useEffect(() => {
    if (id) {
      loadProject();
      loadVersion();
      connectSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    // 自动滚动到日志底部
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 监控执行进度
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (executing && executionStartTime.current) {
      interval = setInterval(() => {
        const elapsed = Date.now() - executionStartTime.current!.getTime();
        const progress = Math.min((elapsed / 300000) * 100, 95); // 5分钟为100%，最大95%
        setExecutionProgress(progress);
        
        // 检查是否长时间无日志输出
        if (lastLogTime && Date.now() - lastLogTime.getTime() > 60000) {
          // 超过1分钟无日志输出
          setLogs(prev => [...prev, {
            timestamp: new Date().toISOString(),
            message: '[系统提示] 脚本可能在等待用户输入或执行耗时操作，请耐心等待...',
            type: 'warning'
          }]);
          setLastLogTime(new Date());
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [executing, lastLogTime]);

  const loadProject = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [project, connections] = await Promise.all([
        projectService.getProjectById(id),
        sshService.getAllConnections()
      ]);
      
      setProject(project);
      
      // 加载对应的SSH连接信息
      const connection = connections.find(c => c.id === project.sshConnectionId);
      setSshConnection(connection || null);
    } catch (error) {
      console.error('加载项目信息失败:', error);
      message.error('项目不存在或加载失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadVersion = async () => {
    if (!id) return;
    
    try {
      await projectService.getVersion(id);
      // 版本信息现在直接从project对象中获取，无需单独状态
    } catch (error) {
      console.error('获取版本信息失败:', error);
    }
  };

  const connectSocket = () => {
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setSocketConnected(true);
      if (id) {
        socketRef.current?.emit('join-project', id);
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    socketRef.current.on('log', (logEntry: LogEntry) => {
      setLogs(prev => [...prev, logEntry]);
      setLastLogTime(new Date());
      
      // 如果是心跳检测或重要信息，更新进度
      if (logEntry.message.includes('心跳检测') || logEntry.message.includes('git pull')) {
        setExecutionProgress(prev => Math.min(prev + 5, 90));
      }
    });

    socketRef.current.on('execution-start', () => {
      setExecuting(true);
      setLogs([]);
      setExecutionProgress(0);
      executionStartTime.current = new Date();
      setLastLogTime(new Date());
      message.info('脚本开始执行');
    });

    socketRef.current.on('execution-end', (success: boolean) => {
      setExecuting(false);
      setExecutionProgress(100);
      loadProject(); // 重新加载项目状态
      if (success) {
        message.success('脚本执行完成');
        loadVersion(); // 重新加载版本信息
      } else {
        message.error('脚本执行失败');
      }
      executionStartTime.current = null;
    });
  };

  const handleExecute = async () => {
    if (!id) return;
    
    try {
      await projectService.executeScript(id);
      message.success('脚本执行已开始');
    } catch (error) {
      message.error('执行脚本失败');
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    setExecutionProgress(0);
  };

  // 新增：加载脚本内容
  const loadScriptContent = async () => {
    if (!id) return;
    
    setScriptLoading(true);
    try {
      const result = await projectService.getScriptContent(id);
      setScriptContent(result.content);
    } catch (error) {
      message.error('获取脚本内容失败');
    } finally {
      setScriptLoading(false);
    }
  };

  // 新增：保存脚本内容
  const saveScriptContent = async () => {
    if (!id) return;
    
    setScriptLoading(true);
    try {
      await projectService.updateScriptContent(id, scriptContent);
      message.success('脚本内容保存成功');
      setEditingScript(false);
    } catch (error) {
      message.error('保存脚本内容失败');
    } finally {
      setScriptLoading(false);
    }
  };

  // 更新：加载版本历史（支持分页）
  const loadVersionHistory = async (resetData: boolean = true) => {
    if (!id) return;
    
    setVersionLoading(true);
    try {
      const page = resetData ? 1 : versionPage;
      const result = await projectService.getVersionHistory(id, page, versionPageSize);
      
      if (resetData) {
        // 重置数据
        setVersionHistory(result.items);
        setVersionPage(1);
      } else {
        // 追加数据
        setVersionHistory(prev => [...prev, ...result.items]);
      }
      
      setVersionTotal(result.total);
      setVersionHasMore(result.hasMore);
      setVersionPage(page);
    } catch (error) {
      message.error('获取版本历史失败');
    } finally {
      setVersionLoading(false);
    }
  };

  // 加载更多版本历史
  const loadMoreVersionHistory = async () => {
    if (!versionHasMore || versionLoading) return;
    
    const nextPage = versionPage + 1;
    setVersionPage(nextPage);
    setVersionLoading(true);
    
    try {
      const result = await projectService.getVersionHistory(id!, nextPage, versionPageSize);
      setVersionHistory(prev => [...prev, ...result.items]);
      setVersionHasMore(result.hasMore);
    } catch (error) {
      message.error('加载更多版本历史失败');
      setVersionPage(versionPage); // 回滚页码
    } finally {
      setVersionLoading(false);
    }
  };

  // 新增：处理Tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'script' && !scriptContent) {
      loadScriptContent();
    } else if (key === 'version-history' && versionHistory.length === 0) {
      loadVersionHistory();
    }
  };

  const getStatusTag = (status: Project['status']) => {
    const statusConfig = {
      idle: { color: 'default', text: '待机' },
      running: { color: 'processing', text: '运行中' },
      success: { color: 'success', text: '成功' },
      error: { color: 'error', text: '失败' }
    };
    return <Tag color={statusConfig[status].color}>{statusConfig[status].text}</Tag>;
  };

  const renderLogEntry = (log: LogEntry, index: number) => {
    const getLogClass = (type: string) => {
      switch (type) {
        case 'error': return 'log-entry error';
        case 'warning': return 'log-entry warning';
        case 'success': return 'log-entry success';
        default: return 'log-entry info';
      }
    };

    return (
      <div key={index} className={getLogClass(log.type)}>
        <Text code style={{ fontSize: '12px', marginRight: '8px', opacity: 0.7 }}>
          {new Date(log.timestamp).toLocaleTimeString()}
        </Text>
        {log.message}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return <div>项目不存在</div>;
  }

  return (
    <div>
      <Card 
        title={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/')}
            >
              返回
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              {project.name}
            </Title>
            {getStatusTag(project.status)}
            <Tag icon={socketConnected ? <WifiOutlined /> : <DisconnectOutlined />} 
                 color={socketConnected ? 'green' : 'red'}>
              {socketConnected ? '已连接' : '连接断开'}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadProject}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleExecute}
              loading={executing}
              disabled={project.status === 'running' || !socketConnected}
            >
              {executing ? '执行中...' : '执行脚本'}
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={8}>
            <Descriptions title="项目信息" column={1} bordered size="small">
              <Descriptions.Item label="项目名称">
                {project.name}
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {project.description || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="SSH连接">
                {sshConnection ? (
                  <Space>
                    <DatabaseOutlined />
                    <span>{sshConnection.name}</span>
                    <Text type="secondary">({sshConnection.username}@{sshConnection.host}:{sshConnection.port})</Text>
                  </Space>
                ) : (
                  <Text type="danger">SSH连接配置丢失</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="工作目录">
                <Text code>{project.workingDirectory}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="当前版本">
                <Space>
                  <Tag color="blue">{project.currentVersion || '0.0.1'}</Tag>
                  <Text type="secondary">平台自动管理版本升级</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="脚本存储">
                <Text type="secondary">平台托管，无需服务器文件</Text>
              </Descriptions.Item>
              <Descriptions.Item label="最后运行">
                {project.lastRun ? new Date(project.lastRun).toLocaleString() : '未运行'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          
          <Col xs={24} xl={16}>
            <Tabs 
              activeKey={activeTab}
              onChange={handleTabChange}
              items={[
                {
                  key: 'logs',
                  label: (
                    <span>
                      <FileTextOutlined />
                      执行日志
                    </span>
                  ),
                  children: (
                    <Card 
                      size="small"
                      extra={
                        <Space>
                          <Button 
                            size="small" 
                            icon={<ClearOutlined />} 
                            onClick={handleClearLogs}
                            disabled={executing}
                          >
                            清空日志
                          </Button>
                        </Space>
                      }
                    >
                      {executing && (
                        <div style={{ marginBottom: '16px' }}>
                          <Progress 
                            percent={Math.round(executionProgress)} 
                            status={executionProgress < 100 ? "active" : "success"}
                            size="default"
                            format={(percent) => `${percent}% (预计5分钟)`}
                          />
                          {executionProgress > 50 && (
                            <Alert
                              message="脚本正在执行中"
                              description="如果长时间无输出，可能是在执行耗时操作（如git pull），请耐心等待"
                              type="info"
                              style={{ marginTop: '8px' }}
                            />
                          )}
                        </div>
                      )}
                      <div 
                        className="log-terminal"
                        ref={logContainerRef}
                        style={{ 
                          height: '750px', // 从650px增加到750px
                          overflow: 'auto',
                          backgroundColor: '#1a1a1a',
                          color: '#00ff00',
                          fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
                          fontSize: '13px',
                          lineHeight: '1.4',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #333'
                        }}
                      >
                        {logs.length === 0 ? (
                          <div style={{ color: '#888', textAlign: 'center', marginTop: '100px' }}>
                            暂无日志，点击"执行脚本"开始...
                          </div>
                        ) : (
                          logs.map((log, index) => renderLogEntry(log, index))
                        )}
                        {executing && logs.length > 0 && (
                          <div className="log-entry info" style={{ opacity: 0.7 }}>
                            <Text code style={{ fontSize: '12px', marginRight: '8px' }}>
                              {new Date().toLocaleTimeString()}
                            </Text>
                            <Spin size="small" style={{ marginRight: '8px' }} />
                            正在执行脚本...
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                },
                {
                  key: 'script',
                  label: (
                    <span>
                      <EditOutlined />
                      脚本管理
                    </span>
                  ),
                  children: (
                    <Card 
                      size="small"
                      title="脚本内容"
                      extra={
                        <Space>
                          {editingScript ? (
                            <>
                              <Button 
                                size="small" 
                                onClick={() => {
                                  setEditingScript(false);
                                  loadScriptContent(); // 重新加载原内容
                                }}
                              >
                                取消
                              </Button>
                              <Button 
                                type="primary"
                                size="small" 
                                icon={<SaveOutlined />}
                                onClick={saveScriptContent}
                                loading={scriptLoading}
                              >
                                保存
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="small" 
                              icon={<EditOutlined />}
                              onClick={() => setEditingScript(true)}
                              disabled={executing}
                            >
                              编辑
                            </Button>
                          )}
                        </Space>
                      }
                    >
                      {scriptLoading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                          <Spin />
                        </div>
                      ) : (
                        <Input.TextArea
                          value={scriptContent}
                          onChange={(e) => setScriptContent(e.target.value)}
                          rows={20}
                          readOnly={!editingScript}
                          style={{
                            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
                            fontSize: '13px',
                            backgroundColor: editingScript ? '#fff' : '#f5f5f5'
                          }}
                          placeholder={scriptContent ? undefined : "点击刷新按钮或切换到此标签页以加载脚本内容..."}
                        />
                      )}
                      {editingScript && (
                        <Alert
                          message="编辑提示"
                          description="修改脚本内容后请点击保存按钮。保存后的脚本将立即生效，下次执行时使用新的脚本内容。"
                          type="info"
                          showIcon
                          style={{ marginTop: '16px' }}
                        />
                      )}
                    </Card>
                  )
                },
                {
                  key: 'version-history',
                  label: (
                    <span>
                      <HistoryOutlined />
                      版本历史
                    </span>
                  ),
                  children: (
                    <Card 
                      size="small"
                      title="版本发布历史"
                      extra={
                        <Button 
                          size="small" 
                          icon={<ReloadOutlined />}
                          onClick={() => loadVersionHistory(true)}
                        >
                          刷新
                        </Button>
                      }
                    >
                      {versionHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                          暂无版本历史记录
                        </div>
                      ) : (
                        <>
                          <div style={{ marginBottom: '16px', color: '#666', fontSize: '13px' }}>
                            共 {versionTotal} 条记录，已显示 {versionHistory.length} 条
                          </div>
                          <Timeline
                            items={versionHistory.map((item, index) => ({
                              color: item.success ? 'green' : 'red',
                              children: (
                                <div>
                                  <Space direction="vertical" size={4}>
                                    <div>
                                      <Tag color={item.success ? 'success' : 'error'}>
                                        版本 {item.version}
                                      </Tag>
                                      {index === 0 && (
                                        <Tag color="blue">当前版本</Tag>
                                      )}
                                    </div>
                                    <div style={{ color: '#666', fontSize: '12px' }}>
                                      {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '13px' }}>
                                      {item.success ? '构建成功' : '构建失败'}
                                    </div>
                                  </Space>
                                </div>
                              )
                            }))}
                            style={{ marginTop: '16px' }}
                          />
                        </>
                      )}
                      {versionHasMore && (
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                          <Button 
                            size="small" 
                            onClick={loadMoreVersionHistory}
                            loading={versionLoading}
                          >
                            加载更多
                          </Button>
                        </div>
                      )}
                    </Card>
                  )
                }
              ]}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ProjectDetail;