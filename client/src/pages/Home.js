import React, { useEffect, useState } from 'react';
import { Button, List, Typography, Empty, Space } from 'antd';
import Layout from '../components/Layout';
import SessionCard from '../components/SessionCard';
import api from '../api/client';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export default function Home() {
  const { user } = useSelector((s) => s.user);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let c = false;
    api
      .get('/api/sessions')
      .then((res) => {
        if (!c && res.data.success) {
          const list = (res.data.data || []).filter((s) => dayjs(s.startTime).isAfter(dayjs().subtract(1, 'day')));
          setSessions(list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
        }
      })
      .catch(() => {
        if (!c) toast.error('Could not load classes');
      });
    return () => {
      c = true;
    };
  }, []);

  const book = async (sessionId) => {
    try {
      const res = await api.post('/api/bookings', { sessionId });
      if (res.data.success) {
        if (res.data.data?.waitlisted) toast.success("You're on the waitlist");
        else toast.success('Booked');
        const r2 = await api.get('/api/sessions');
        if (r2.data.success) setSessions(r2.data.data || []);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not book');
    }
  };

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header">
          <Title level={2}>Schedule</Title>
          <p className="page-subtitle">Upcoming sessions open for booking</p>
        </header>
        {user?.role === 'client' && !user?.emailVerified && (
          <Text type="warning" className="d-block mb-4">
            Verify your email to book classes.
          </Text>
        )}

        <List
        grid={{ gutter: 16, xs: 1, md: 2, lg: 3 }}
        dataSource={sessions}
        locale={{ emptyText: <Empty description="No sessions scheduled" /> }}
        renderItem={(s) => (
          <List.Item>
            <SessionCard
              session={s}
              footer={
                <Space wrap size="small">
                  {user?.role === 'client' && (
                    <Button type="primary" onClick={() => book(s._id)}>
                      Book
                    </Button>
                  )}
                  {(user?.role === 'trainer' || user?.role === 'admin') && (
                    <Link to="/trainer">
                      <Button>Trainer hub</Button>
                    </Link>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
      </div>
    </Layout>
  );
}
