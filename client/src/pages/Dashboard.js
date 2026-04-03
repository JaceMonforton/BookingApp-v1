import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Button, Empty, Statistic, Row, Col, Space } from 'antd';
import Layout from '../components/Layout';
import SessionCard from '../components/SessionCard';
import api from '../api/client';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

function Countdown({ target }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const d = dayjs(target);
  if (d.isBefore(now)) return <Text type="secondary">Started</Text>;
  return <Text>{d.from(dayjs(now))}</Text>;
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [myPackages, setMyPackages] = useState([]);
  const [past, setPast] = useState([]);

  useEffect(() => {
    let c = false;
    async function load() {
      try {
        const [b, m] = await Promise.all([
          api.get('/api/bookings/me'),
          api.get('/api/packages/my-packages'),
        ]);
        if (!c && b.data.success) {
          const all = b.data.data || [];
          const upcoming = all.filter((x) => x.session && dayjs(x.session.startTime).isAfter(dayjs()));
          const old = all.filter((x) => x.session && !dayjs(x.session.startTime).isAfter(dayjs()));
          setBookings(upcoming);
          setPast(old.slice(0, 5));
        }
        if (!c && m.data.success) setMyPackages(m.data.data || []);
      } catch {
        if (!c) toast.error('Could not load dashboard');
      }
    }
    load();
    return () => {
      c = true;
    };
  }, []);

  const active = myPackages.filter((p) => p.status === 'active')[0];

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header">
          <Title level={2}>Dashboard</Title>
          <p className="page-subtitle">Your training snapshot</p>
        </header>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={12}>
          <Card title="Active package" style={{ borderColor: 'var(--color-border)' }}>
            {active ? (
              <>
                <Statistic title={active.package?.name} value={active.totalRemainingClasses} suffix="classes left" />
                <Text type="secondary">
                  This week: {active.classesRemainingThisWeek} remaining · Ends{' '}
                  {dayjs(active.endDate).format('MMM D, YYYY')}
                </Text>
              </>
            ) : (
              <Empty description="No active package" />
            )}
            <Button type="link" href="/packages">
              Browse packages
            </Button>
          </Card>
        </Col>
      </Row>

      <Card title="Upcoming bookings" className="mb-4" style={{ borderColor: 'var(--color-border)' }}>
        {bookings.length === 0 ? (
          <Empty />
        ) : (
          <List
            dataSource={bookings}
            renderItem={(item) => (
              <List.Item>
                <SessionCard
                  session={item.session}
                  bookingStatus={item.status}
                  timeExtra={<Countdown target={item.session?.startTime} />}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card title="Quick re-book from past sessions" style={{ borderColor: 'var(--color-border)' }}>
        {past.length === 0 ? (
          <Empty />
        ) : (
          <List
            dataSource={past}
            renderItem={(item) => (
              <List.Item>
                <SessionCard
                  session={item.session}
                  bookingStatus={item.status}
                  footer={
                    <Space>
                      <Button type="link" href="/">
                        View schedule
                      </Button>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
      </div>
    </Layout>
  );
}
