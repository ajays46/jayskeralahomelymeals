import React from 'react';
import { Modal, Button, Typography, Space, Alert } from 'antd';
import { ExclamationCircleOutlined, UserOutlined, ShoppingOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const AdminOrderBlockedModal = ({ visible, onClose, onSwitchAccount }) => {
  const handleSwitchAccount = () => {
    onSwitchAccount();
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>Admin Access Restricted</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          Close
        </Button>,
        <Button 
          key="switch" 
          type="primary" 
          onClick={handleSwitchAccount}
          icon={<UserOutlined />}
        >
          Switch Account
        </Button>
      ]}
      width={500}
      centered
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="Ordering Restricted for Admins"
          description="Administrators cannot place orders through this system. This restriction helps maintain proper business operations and prevents conflicts of interest."
          type="warning"
          showIcon
          icon={<ShoppingOutlined />}
        />
        
        <div>
          <Title level={4}>Why is this restricted?</Title>
          <Paragraph>
            <ul>
              <li>Admins manage the system and menu items</li>
              <li>Prevents potential conflicts of interest</li>
              <li>Maintains clear separation of roles</li>
              <li>Ensures proper business workflow</li>
            </ul>
          </Paragraph>
        </div>

        <div>
          <Title level={4}>What can you do?</Title>
          <Paragraph>
            <Text strong>Option 1:</Text> Switch to a seller or user account to place orders
          </Paragraph>
          <Paragraph>
            <Text strong>Option 2:</Text> Use the admin panel to manage orders and view order analytics
          </Paragraph>
        </div>

        <Alert
          message="Need Help?"
          description="If you need to place an order for testing or business purposes, please contact the system administrator or use a different account role."
          type="info"
          showIcon
        />
      </Space>
    </Modal>
  );
};

export default AdminOrderBlockedModal;
