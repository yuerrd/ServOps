import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  WifiOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { SSHConnection } from '../types';
import { sshService } from '../services/api';

const SSHConnectionList: React.FC = () => {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null);
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const data = await sshService.getAllConnections();
      setConnections(data);
    } catch (error) {
      message.error('加载SSH连接列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (connection: SSHConnection) => {
    setEditingConnection(connection);
    form.setFieldsValue(connection);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingConnection(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingConnection) {
        await sshService.updateConnection(editingConnection.id, values);
        message.success('SSH连接更新成功');
      } else {
        await sshService.createConnection(values);
        message.success('SSH连接创建成功');
      }
      setModalVisible(false);
      loadConnections();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (connectionId: string) => {
    try {
      await sshService.deleteConnection(connectionId);
      message.success('SSH连接删除成功');
      loadConnections();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const values = await form.validateFields();
      const result = await sshService.testConnection(values);
      
      if (result.success) {
        message.success('连接测试成功');
      } else {
        message.error(`连接测试失败: ${result.message}`);
      }
    } catch (error) {
      message.error('连接测试失败');
    } finally {
      setTesting(false);
    }
  };

  const columns = [
    {
      title: '连接名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <DatabaseOutlined />
          {name}
        </Space>
      )
    },
    {
      title: '服务器信息',
      key: 'server',
      render: (record: SSHConnection) => (
        <div>
          <div>{record.username}@{record.host}:{record.port}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '认证方式',
      key: 'auth',
      render: (record: SSHConnection) => (
        <Space>
          {record.privateKey ? (
            <Tag color="blue">私钥</Tag>
          ) : (
            <Tag color="orange">密码</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: SSHConnection) => (
        <Space>
          <Tooltip title="编辑">
            <Button 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此SSH连接吗？"
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
      title="SSH连接管理" 
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadConnections}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增连接
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={connections}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingConnection ? '编辑SSH连接' : '新增SSH连接'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="name" 
            label="连接名称" 
            rules={[{ required: true, message: '请输入连接名称' }]}
          >
            <Input placeholder="例如: 主服务器" />
          </Form.Item>
          
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="连接描述（可选）" />
          </Form.Item>
          
          <Form.Item 
            name="host" 
            label="服务器地址" 
            rules={[{ required: true, message: '请输入服务器地址' }]}
          >
            <Input placeholder="例如: 10.1.122.14" />
          </Form.Item>
          
          <Form.Item 
            name="port" 
            label="SSH端口" 
            rules={[{ required: true, message: '请输入SSH端口' }]}
            initialValue={22}
          >
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item 
            name="username" 
            label="用户名" 
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="例如: wutong" />
          </Form.Item>
          
          <Form.Item name="password" label="SSH密码">
            <Input.Password placeholder="SSH登录密码（可选，优先使用私钥）" />
          </Form.Item>
          
          <Form.Item name="privateKey" label="SSH私钥">
            <Input.TextArea 
              rows={4} 
              placeholder="SSH私钥内容（可选，优先于密码认证）" 
            />
          </Form.Item>
          
          <Form.Item name="passphrase" label="私钥密码">
            <Input.Password placeholder="私钥密码（如果私钥有密码保护）" />
          </Form.Item>
          
          <div style={{ marginTop: 16 }}>
            <Button 
              icon={<WifiOutlined />}
              onClick={handleTestConnection}
              loading={testing}
            >
              测试连接
            </Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default SSHConnectionList;