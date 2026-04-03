import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Spin } from 'antd';
import Layout from '../components/Layout';
import api, { getAccessToken } from '../api/client';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const TYPE_LABEL = {
  mat_pilates: 'Mat Pilates',
  reformer: 'Reformer',
  personal_training: 'Personal Training',
  zoom: 'Zoom',
  all: 'All types',
};

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [myPackages, setMyPackages] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get('/api/packages');
        if (!cancelled && res.data.success) setPackages(res.data.data || []);
        if (getAccessToken()) {
          try {
            const mine = await api.get('/api/packages/my-packages');
            if (!cancelled && mine.data.success) setMyPackages(mine.data.data || []);
          } catch {
            if (!cancelled) setMyPackages(null);
          }
        }
      } catch {
        if (!cancelled) toast.error('Could not load packages');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const buy = async (packageId) => {
    if (!getAccessToken()) {
      toast.error('Sign in as a client to purchase');
      navigate('/login');
      return;
    }
    if (user?.role !== 'client') {
      toast.error('Only client accounts can purchase packages');
      return;
    }
    try {
      const res = await api.post('/api/packages/purchase', { packageId });
      if (res.data.success && res.data.data?.url) {
        window.location.href = res.data.data.url;
      } else {
        toast.error(res.data.error || 'Checkout unavailable');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not start checkout');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="page-container d-flex justify-content-center py-5">
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header">
          <Title level={2}>Membership packages</Title>
          <Paragraph className="page-subtitle mb-0" type="secondary">
            Transparent pricing for every training track. Sign in as a client to purchase online.
          </Paragraph>
        </header>

      {myPackages && myPackages.length > 0 && (
        <Card title="Your entitlements" className="mb-4" style={{ borderColor: 'var(--color-border)' }}>
          {myPackages.map((cp) => (
            <div key={cp._id} className="mb-2">
              <strong>{cp.package?.name}</strong> — {cp.status} · {cp.classesBooked}/{cp.totalClasses}{' '}
              classes used · {cp.classesRemainingThisWeek} left this week
            </div>
          ))}
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {packages.map((p) => (
          <Col xs={24} md={8} key={p._id}>
            <Card
              className="package-card"
              title={p.name}
              extra={<Tag color="geekblue">{TYPE_LABEL[p.classType] || p.classType}</Tag>}
              actions={[
                <Button
                  type="primary"
                  key="buy"
                  onClick={() => buy(p._id)}
                  disabled={!p.stripePriceId}
                >
                  {p.stripePriceId ? 'Buy now' : 'Coming soon'}
                </Button>,
              ]}
            >
              <Paragraph>{p.description}</Paragraph>
              <Paragraph type="secondary">
                {p.durationWeeks} weeks · {p.classesPerWeek} classes/week · {p.totalClasses} total
              </Paragraph>
              <Title level={4} style={{ marginBottom: 0, color: 'var(--color-accent)' }}>
                ${(p.price / 100).toFixed(2)}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>
      </div>
    </Layout>
  );
}
