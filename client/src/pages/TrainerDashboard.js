import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, List, Typography, Button, Modal, Table, Tag, Empty, Row, Col, Statistic } from 'antd';
import Layout from '../components/Layout';
import SessionCard from '../components/SessionCard';
import CreateSessionForm from '../components/CreateSessionForm';
import api from '../api/client';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

dayjs.extend(isBetween);

const { Title, Text } = Typography;

export default function TrainerDashboard() {
  const { user } = useSelector((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [rosterSession, setRosterSession] = useState(null);
  const [roster, setRoster] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/sessions');
      if (res.data.success) {
        let list = (res.data.data || []).filter((s) => dayjs(s.startTime).isAfter(dayjs().subtract(1, 'day')));
        if (user?.role === 'trainer') {
          list = list.filter((s) => String(s.trainer?._id || s.trainer) === String(user._id));
        }
        setSessions(list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
      }
    } catch {
      toast.error('Could not load sessions');
    }
  }, [user?._id, user?.role]);

  useEffect(() => {
    if (user?._id) load();
  }, [user?._id, load]);

  useEffect(() => {
    if (!location.state?.openCreateSession) return;
    setCreateOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.openCreateSession, location.pathname, navigate]);

  const { sessionsNext7Days, weekRangeLabel, weekEndDayLabel } = useMemo(() => {
    const now = dayjs();
    const weekEnd = now.add(7, 'day').endOf('day');
    const list = sessions.filter((s) => {
      const t = dayjs(s.startTime);
      return t.isBetween(now, weekEnd, null, '[]');
    });
    return {
      sessionsNext7Days: list,
      weekRangeLabel: `${now.format('MMM D')} – ${weekEnd.format('MMM D, YYYY')}`,
      weekEndDayLabel: weekEnd.format('dddd, MMM D, YYYY'),
    };
  }, [sessions]);

  const openRoster = async (id) => {
    try {
      const res = await api.get(`/api/bookings/session/${id}`);
      if (res.data.success) {
        setRosterSession(res.data.data.session);
        setRoster(res.data.data.roster);
      }
    } catch {
      toast.error('Could not load roster');
    }
  };

  const cancelSession = async () => {
    if (!cancelPreview) return;
    try {
      await api.delete(`/api/sessions/${cancelPreview._id}`);
      toast.success('Session cancelled — clients notified');
      setCancelPreview(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const columns = [
    { title: 'Client', dataIndex: ['client', 'name'], key: 'name' },
    { title: 'Email', dataIndex: ['client', 'email'], key: 'email' },
    { title: 'Phone', dataIndex: ['client', 'phone'], key: 'phone' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag>{s}</Tag>,
    },
  ];

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header page-header--trainer-hub">
          <div>
            <Title level={2}>Trainer hub</Title>
            <p className="page-subtitle">Sessions, rosters, and capacity at a glance</p>
          </div>
          <Button type="primary" size="large" onClick={() => setCreateOpen(true)}>
            Create session
          </Button>
        </header>

      <Card className="mt-2 mb-4 trainer-hub-summary-card" style={{ borderColor: 'var(--color-border)' }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Statistic title="Next 7 days" value={sessionsNext7Days.length} suffix="sessions" />
          </Col>
          <Col xs={24} sm={12} md={16}>
            <Text type="secondary" className="trainer-hub-summary-card__range">
              Counts sessions whose start time falls between now and the end of{' '}
              <strong>{weekEndDayLabel}</strong>
              <span className="trainer-hub-summary-card__range-detail"> (calendar span {weekRangeLabel})</span>
            </Text>
          </Col>
        </Row>
      </Card>

      <List
        grid={{ gutter: 16, xs: 1, md: 2 }}
        dataSource={sessions}
        locale={{ emptyText: <Empty description="No upcoming sessions" /> }}
        renderItem={(s) => (
          <List.Item>
            <SessionCard
              session={s}
              showCapacityBar
              headerExtra={
                <Button danger size="small" onClick={() => setCancelPreview(s)}>
                  Cancel class
                </Button>
              }
              footer={
                <Button type="primary" ghost onClick={() => openRoster(s._id)}>
                  Roster
                </Button>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title="New session"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <CreateSessionForm
          user={user}
          onSuccess={() => {
            setCreateOpen(false);
            load();
          }}
        />
      </Modal>

      <Modal
        title="Roster"
        open={!!roster}
        onCancel={() => setRoster(null)}
        footer={null}
        width={720}
      >
        {rosterSession && (
          <Text type="secondary" className="d-block mb-2">
            {dayjs(rosterSession.startTime).format('LLL')}
          </Text>
        )}
        <Table rowKey="_id" columns={columns} dataSource={roster || []} pagination={false} size="small" />
      </Modal>

      <Modal
        title="Cancel session"
        open={!!cancelPreview}
        onOk={cancelSession}
        onCancel={() => setCancelPreview(null)}
        okText="Confirm & notify"
      >
        {cancelPreview && (
          <>
            <p>
              Cancel <strong>{cancelPreview.type?.replace(/_/g, ' ')}</strong> on{' '}
              {dayjs(cancelPreview.startTime).format('LLL')}?
            </p>
            <Text type="warning">Clients will receive email and SMS (if configured).</Text>
          </>
        )}
      </Modal>
      </div>
    </Layout>
  );
}
