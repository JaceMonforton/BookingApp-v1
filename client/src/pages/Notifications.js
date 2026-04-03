import React from 'react';
import Layout from '../components/Layout';
import { Typography, Empty } from 'antd';

const { Title, Paragraph } = Typography;

export default function Notifications() {
  return (
    <Layout>
      <div className="page-container">
        <header className="page-header">
          <Title level={2}>Notifications</Title>
          <Paragraph type="secondary" className="page-subtitle mb-0">
            Booking updates are sent by email and SMS. An in-app inbox will appear here later.
          </Paragraph>
        </header>
        <Empty description="No in-app notifications" />
      </div>
    </Layout>
  );
}
