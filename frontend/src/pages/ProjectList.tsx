import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Pagination
} from 'antd';
import { 
  PlayCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  CopyOutlined,
  DatabaseOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Project, SSHConnection } from '../types';
import { projectService, sshService, templateService } from '../services/api';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sshConnections, setSshConnections] = useState<SSHConnection[]>([]);
  const [templates, setTemplates] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();
  const navigate = useNavigate();

  // 分页和搜索状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, connectionsData, templatesData] = await Promise.all([
        projectService.getProjects(pagination.current, pagination.pageSize, searchTerm),
        sshService.getAllConnections(),
        templateService.getTemplates()
      ]);
      
      setProjects(projectsData.projects);
      setPagination(prev => ({
        ...prev,
        total: projectsData.total
      }));
      setSshConnections(connectionsData);
      setTemplates(templatesData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({
      ...prev,
      current: 1 // 搜索时重置到第一页
    }));
  };

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  };

  const handleExecute = async (projectId: string) => {
    try {
      await projectService.executeScript(projectId);
      message.success('脚本执行已开始');
      navigate(`/project/${projectId}`);
    } catch (error) {
      message.error('执行脚本失败');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      currentVersion: project.currentVersion || '0.0.1'
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({
      currentVersion: '0.0.1',
      scriptContent: `#!/bin/bash

# 设置脚本在任何命令失败时退出
set -e

# 从平台获取当前版本号
original_version="{{CURRENT_VERSION}}"
echo "当前版本号为: $original_version"

# 在这里添加你的脚本逻辑
echo "开始执行任务..."

# 示例：执行一些命令
# git pull
# npm install
# npm run build

echo "任务执行完成！"`
    });
    setModalVisible(true);
  };

  const handleCreateFromTemplate = (template: Project) => {
    setSelectedTemplate(template);
    templateForm.resetFields();
    templateForm.setFieldsValue({
      name: `${template.name} - 副本`,
      description: template.description,
      currentVersion: '0.0.1'
    });
    setTemplateModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingProject) {
        await projectService.updateProject(editingProject.id, values);
        message.success('项目更新成功');
      } else {
        await projectService.createProject({
          ...values,
          isTemplate: false
        });
        message.success('项目创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleCreateFromTemplateSubmit = async () => {
    if (!selectedTemplate) return;
    
    try {
      const values = await templateForm.validateFields();
      await templateService.createProjectFromTemplate(selectedTemplate.id, values);
      message.success('基于模板创建项目成功');
      setTemplateModalVisible(false);
      loadData();
    } catch (error) {
      message.error('创建项目失败');
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      message.success('项目删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
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

  const getSSHConnectionName = (sshConnectionId: string) => {
    const connection = sshConnections.find(c => c.id === sshConnectionId);
    return connection ? connection.name : '未知连接';
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Project) => (
        <Space direction="vertical" size={0}>
          <span>{name}</span>
          {record.isTemplate && <Tag color="blue" size="small">模板</Tag>}
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'SSH连接',
      key: 'sshConnection',
      render: (record: Project) => (
        <Space>
          <DatabaseOutlined />
          {getSSHConnectionName(record.sshConnectionId)}
        </Space>
      ),
    },
    {
      title: '当前版本',
      dataIndex: 'currentVersion',
      key: 'currentVersion',
      render: (version: string) => <Tag color="blue">{version}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Project['status']) => getStatusTag(status),
    },
    {
      title: '最后运行',
      dataIndex: 'lastRun',
      key: 'lastRun',
      render: (date: Date) => date ? new Date(date).toLocaleString() : '未运行',
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: Project) => (
        <Space>
          {!record.isTemplate && (
            <Tooltip title="执行脚本">
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={() => handleExecute(record.id)}
                disabled={record.status === 'running'}
              />
            </Tooltip>
          )}
          <Tooltip title="查看详情">
            <Button 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/project/${record.id}`)}
            />
          </Tooltip>
          {record.isTemplate && (
            <Tooltip title="基于模板创建">
              <Button 
                icon={<CopyOutlined />}
                onClick={() => handleCreateFromTemplate(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <Button 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此项目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="项目管理" 
      extra={
        <Space>
          <Input.Search
            placeholder="搜索项目"
            onSearch={handleSearch}
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增项目
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />
      
      {/* 分页组件 - 右下角对齐，显示总数 */}
      <div style={{ 
        marginTop: 24, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ color: '#666', fontSize: '14px' }}>
          共 {pagination.total} 个项目
          {searchTerm && (
            <span>, 搜索"{searchTerm}"找到 {projects.length} 个结果</span>
          )}
        </div>
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={handlePageChange}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }
          pageSizeOptions={['10', '20', '50', '100']}
          size="default"
        />
      </div>

      {/* 项目编辑/创建模态框 */}
      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="name" 
            label="项目名称" 
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Form.Item 
            name="sshConnectionId" 
            label="SSH连接" 
            rules={[{ required: true, message: '请选择SSH连接' }]}
          >
            <Select placeholder="选择SSH连接">
              {sshConnections.map(conn => (
                <Select.Option key={conn.id} value={conn.id}>
                  {conn.name} ({conn.username}@{conn.host}:{conn.port})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="workingDirectory" 
            label="工作目录" 
            rules={[{ required: true, message: '请输入工作目录路径' }]}
          >
            <Input placeholder="例如: /home/wutong/codes/wt/WTP269_TinnoveTms" />
          </Form.Item>
          
          <Form.Item 
            name="currentVersion" 
            label="当前版本" 
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="例如: 1.0.0" />
          </Form.Item>
          
          <Form.Item 
            name="scriptContent" 
            label="脚本内容" 
            rules={[{ required: true, message: '请输入脚本内容' }]}
          >
            <Input.TextArea 
              rows={15} 
              placeholder="输入Shell脚本内容..."
              style={{ 
                fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
                fontSize: '13px'
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 基于模板创建项目模态框 */}
      <Modal
        title={`基于模板创建项目: ${selectedTemplate?.name}`}
        open={templateModalVisible}
        onOk={handleCreateFromTemplateSubmit}
        onCancel={() => setTemplateModalVisible(false)}
        okText="创建"
        cancelText="取消"
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item 
            name="name" 
            label="项目名称" 
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Form.Item 
            name="sshConnectionId" 
            label="SSH连接" 
            rules={[{ required: true, message: '请选择SSH连接' }]}
          >
            <Select placeholder="选择SSH连接">
              {sshConnections.map(conn => (
                <Select.Option key={conn.id} value={conn.id}>
                  {conn.name} ({conn.username}@{conn.host}:{conn.port})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="currentVersion" 
            label="初始版本" 
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="例如: 0.0.1" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ProjectList;