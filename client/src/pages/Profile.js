import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  Button,
  Card,
  Typography,
  Tag,
  Row,
  Col,
  Avatar,
  Descriptions,
  Modal,
  Form,
  Input,
  Space,
  Alert,
  Tabs,
  Empty,
  Divider,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  FormOutlined,
  TeamOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { showLoading, hideLoading } from '../redux/alertSlice';
import { setUser } from '../redux/userSlice';
import toast from 'react-hot-toast';
import api from '../api/client';
import dayjs from 'dayjs';
import SessionCard from '../components/SessionCard';

const { Title, Text, Paragraph } = Typography;

export default function Profile() {
  const [bookings, setBookings] = useState([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [profileForm] = Form.useForm();
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data.success && res.data.data) dispatch(setUser(res.data.data));
    } catch {
      /* ignore */
    }
  }, [dispatch]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (user?.role !== 'client') return;
    let c = false;
    async function load() {
      try {
        dispatch(showLoading());
        const res = await api.get('/api/bookings/me');
        dispatch(hideLoading());
        if (!c && res.data.success) setBookings(res.data.data || []);
      } catch {
        dispatch(hideLoading());
        if (!c) toast.error('Could not load bookings');
      }
    }
    load();
    return () => {
      c = true;
    };
  }, [user?.role, dispatch]);

  const { upcoming, past } = useMemo(() => {
    const now = dayjs();
    const u = [];
    const p = [];
    (bookings || []).forEach((b) => {
      if (!b.session?.startTime) return;
      if (dayjs(b.session.startTime).isAfter(now)) u.push(b);
      else p.push(b);
    });
    u.sort((a, b) => new Date(a.session.startTime) - new Date(b.session.startTime));
    p.sort((a, b) => new Date(b.session.startTime) - new Date(a.session.startTime));
    return { upcoming: u, past: p.slice(0, 8) };
  }, [bookings]);

  const genTrainerInvite = async () => {
    try {
      const res = await api.post('/api/auth/trainer-invite', {});
      if (res.data.success && res.data.data?.signupUrl) {
        setInviteUrl(res.data.data.signupUrl);
        toast.success('Invite link created');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const cancel = async (bookingId) => {
    try {
      dispatch(showLoading());
      await api.delete(`/api/bookings/${bookingId}`);
      dispatch(hideLoading());
      toast.success('Cancelled');
      const res = await api.get('/api/bookings/me');
      if (res.data.success) setBookings(res.data.data || []);
    } catch (e) {
      dispatch(hideLoading());
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const openEdit = () => {
    profileForm.setFieldsValue({
      name: user?.name,
      phone: user?.phone || '',
    });
    setEditOpen(true);
  };

  const saveProfile = async (values) => {
    try {
      dispatch(showLoading());
      const res = await api.put('/api/auth/profile', {
        name: values.name?.trim(),
        phone: values.phone?.trim() ?? '',
      });
      dispatch(hideLoading());
      if (res.data.success) {
        dispatch(setUser(res.data.data));
        toast.success('Profile updated');
        setEditOpen(false);
      }
    } catch (e) {
      dispatch(hideLoading());
      toast.error(e.response?.data?.error || 'Update failed');
    }
  };

  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'trainer' ? 'Trainer' : 'Client';
  const initials = (user?.name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const bookingCards = (list) =>
    list.length === 0 ? (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing here" />
    ) : (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {list.map((b) => (
          <SessionCard
            key={b._id}
            session={b.session}
            bookingStatus={b.status}
            headerExtra={
              (b.status === 'confirmed' || b.status === 'waitlisted') ? (
                <Button danger size="small" onClick={() => cancel(b._id)}>
                  Cancel
                </Button>
              ) : null
            }
          />
        ))}
      </Space>
    );

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header">
          <Title level={2}>Profile</Title>
          <Paragraph type="secondary" className="page-subtitle mb-0">
            Account settings, bookings, and studio tools
          </Paragraph>
        </header>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card className="mb-4 profile-account-card">
              <Space align="start" size="large" wrap>
                <Avatar size={72} className="profile-avatar">
                  {initials || <UserOutlined />}
                </Avatar>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
                    {user?.name}
                  </Title>
                  <Space wrap>
                    <Tag color="geekblue">{roleLabel}</Tag>
                    {user?.emailVerified ? (
                      <Tag color="success">Email verified</Tag>
                    ) : (
                      <Tag color="warning">Email not verified</Tag>
                    )}
                    {user?.hasSignedWaiver?.signedwaiver ? (
                      <Tag icon={<SafetyCertificateOutlined />} color="processing">
                        Waiver on file
                      </Tag>
                    ) : (
                      <Tag color="default">Waiver pending</Tag>
                    )}
                  </Space>
                  <Descriptions column={1} size="small" className="mt-3 profile-descriptions">
                    <Descriptions.Item label={<><MailOutlined /> Email</>}>
                      <Text copyable>{user?.email}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                      {user?.phone ? <Text copyable>{user.phone}</Text> : <Text type="secondary">Not set</Text>}
                    </Descriptions.Item>
                  </Descriptions>
                  <Button type="default" icon={<EditOutlined />} onClick={openEdit} className="mt-2">
                    Edit name &amp; phone
                  </Button>
                </div>
              </Space>
            </Card>

            {!user?.emailVerified && (
              <Alert
                className="mb-4"
                type="warning"
                showIcon
                message="Verify your email"
                description="Check your inbox for the verification link we sent when you signed up. You need a verified email to book classes."
              />
            )}

            {user?.role === 'client' && !user?.hasSignedWaiver?.signedwaiver && (
              <Alert
                className="mb-4"
                type="info"
                showIcon
                message="Complete your waiver"
                description={
                  <>
                    Sign the liability waiver before booking.{' '}
                    <Link to="/forms">Go to Forms</Link>
                  </>
                }
              />
            )}
          </Col>

          <Col xs={24} lg={10}>
            <Card title="Quick actions" className="mb-4">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Link to="/dashboard">
                  <Button block icon={<DashboardOutlined />} disabled={user?.role !== 'client'}>
                    Client dashboard
                  </Button>
                </Link>
                <Link to="/packages">
                  <Button block icon={<ShoppingOutlined />}>
                    Membership packages
                  </Button>
                </Link>
                <Link to="/forms">
                  <Button block icon={<FormOutlined />}>
                    Forms &amp; waivers
                  </Button>
                </Link>
                {(user?.role === 'trainer' || user?.role === 'admin') && (
                  <>
                    <Link to="/trainer">
                      <Button block icon={<TeamOutlined />}>
                        Trainer hub
                      </Button>
                    </Link>
                    <Link to="/trainer" state={{ openCreateSession: true }}>
                      <Button block icon={<CalendarOutlined />}>
                        Create session
                      </Button>
                    </Link>
                  </>
                )}
              </Space>
            </Card>

            <Card title="Security" size="small">
              <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                Password changes use a secure email link.
              </Paragraph>
              <Link to="/login">
                <Button block>Use “Forgot password?” on sign-in</Button>
              </Link>
            </Card>
          </Col>
        </Row>

        {user?.role === 'admin' && (
          <Card title="Studio administration" className="mb-4 mt-2">
            <Paragraph type="secondary">
              Generate a one-time link for a new trainer to register with the <strong>trainer</strong> role.
            </Paragraph>
            <Button type="primary" onClick={genTrainerInvite}>
              Generate trainer invite link
            </Button>
            {inviteUrl && (
              <div className="mt-3">
                <Text type="secondary">Share this URL:</Text>
                <div className="mt-1">
                  <Text copyable code style={{ wordBreak: 'break-all' }}>
                    {inviteUrl}
                  </Text>
                </div>
              </div>
            )}
          </Card>
        )}

        {user?.role === 'client' && (
          <Card title="My bookings" className="mt-2">
            <Tabs
              items={[
                {
                  key: 'upcoming',
                  label: `Upcoming (${upcoming.length})`,
                  children: bookingCards(upcoming),
                },
                {
                  key: 'past',
                  label: `Past (${past.length})`,
                  children: bookingCards(past),
                },
              ]}
            />
          </Card>
        )}

        {(user?.role === 'trainer' || user?.role === 'admin') && (
          <Card title="Schedule tools" className="mt-2">
            <Paragraph type="secondary">
              Manage rosters, capacity, and cancellations from the trainer hub.
            </Paragraph>
            <Space wrap>
              <Link to="/trainer">
                <Button type="primary">Open trainer hub</Button>
              </Link>
              <Link to="/">
                <Button>View public schedule</Button>
              </Link>
            </Space>
          </Card>
        )}
      </div>

      <Modal
        title="Edit profile"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
          <Form.Item
            label="Display name"
            name="name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="Your name" />
          </Form.Item>
          <Form.Item
            label="Phone (E.164 recommended for SMS)"
            name="phone"
            extra="Example: +15551234567"
          >
            <Input placeholder="+1…" />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Space>
            <Button type="primary" htmlType="submit">
              Save changes
            </Button>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </Layout>
  );
}
