import { Routes, Route } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  ProjectOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import SSHConnectionList from './pages/SSHConnectionList';

const { Header, Content, Sider } = Layout;

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/ssh-connections',
      icon: <DatabaseOutlined />,
      label: 'SSH连接管理',
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header>
        <div className="logo">ServOps</div>
        <div style={{ color: 'white' }}>远程脚本执行管理平台</div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content style={{ padding: '24px', margin: 0, minHeight: 280, background: '#fff' }}>
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/ssh-connections" element={<SSHConnectionList />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;