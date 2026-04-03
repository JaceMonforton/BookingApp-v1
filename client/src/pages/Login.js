import React, { useMemo, useState } from 'react';
import { Form, Input, Button, Checkbox, Progress, Tabs, Typography, Row, Col, Modal, Card } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { hideLoading, showLoading } from '../redux/alertSlice';
import { setUser } from '../redux/userSlice';
import { setAccessToken } from '../api/client';
const { Title, Text } = Typography;

function strengthScore(password) {
  if (!password) return 0;
  let s = 0;
  if (password.length >= 8) s += 25;
  if (/[A-Z]/.test(password)) s += 25;
  if (/[0-9]/.test(password)) s += 25;
  if (/[^A-Za-z0-9]/.test(password)) s += 25;
  return s;
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const invite = searchParams.get('invite');
  const resetToken = searchParams.get('reset');
  const verified = searchParams.get('verified');
  const tab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState(invite || tab === 'signup' ? 'signup' : 'login');
  const [pwSignup, setPwSignup] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (verified === '1') toast.success('Email verified — you can sign in.');
    if (verified === '0') toast.error('Verification link invalid or expired.');
  }, [verified]);

  const score = useMemo(() => strengthScore(pwSignup), [pwSignup]);

  const onLogin = async (values) => {
    try {
      dispatch(showLoading());
      const response = await axios.post('/api/auth/login', values, { withCredentials: true });
      dispatch(hideLoading());
      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        setAccessToken(accessToken);
        dispatch(setUser(user));
        toast.success('Welcome back');
        navigate('/');
      } else {
        toast.error(response.data.error || 'Login failed');
      }
    } catch (e) {
      dispatch(hideLoading());
      toast.error(e.response?.data?.error || 'Something went wrong');
    }
  };

  const onSignup = async (values) => {
    try {
      dispatch(showLoading());
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        ...(invite ? { inviteToken: invite } : {}),
      };
      const response = await axios.post('/api/auth/signup', payload, { withCredentials: true });
      dispatch(hideLoading());
      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        setAccessToken(accessToken);
        dispatch(setUser(user));
        toast.success('Account created — check email to verify');
        navigate('/');
      } else {
        toast.error(response.data.error || 'Signup failed');
      }
    } catch (e) {
      dispatch(hideLoading());
      toast.error(e.response?.data?.error || 'Something went wrong');
    }
  };

  const onForgot = async (values) => {
    try {
      await axios.post('/api/auth/forgot-password', { email: values.email });
      toast.success('If that email exists, we sent reset instructions.');
      setForgotOpen(false);
    } catch {
      toast.error('Request failed');
    }
  };

  const onReset = async (values) => {
    if (!resetToken) return;
    try {
      dispatch(showLoading());
      const response = await axios.post(
        `/api/auth/reset-password/${resetToken}`,
        { password: values.password },
        { withCredentials: true }
      );
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success('Password updated — sign in');
        navigate('/login');
      } else {
        toast.error(response.data.error || 'Reset failed');
      }
    } catch (e) {
      dispatch(hideLoading());
      toast.error(e.response?.data?.error || 'Invalid or expired link');
    }
  };

  if (resetToken) {
    return (
      <div className="authentication auth-split">
        <Row className="auth-split-row">
          <Col xs={24} md={0} className="auth-mobile-bar">
            <span className="auth-mobile-bar__title">Pulsed</span>
          </Col>
          <Col xs={0} md={12} className="auth-split-brand">
            <Text className="auth-brand-kicker">Pulsed</Text>
            <Title level={2}>Secure your account</Title>
            <Text className="auth-brand-tagline">Choose a strong new password to continue.</Text>
          </Col>
          <Col xs={24} md={12} className="auth-split-form">
            <Card className="auth-panel" bordered={false}>
              <Title level={3} style={{ marginTop: 0 }}>
                Reset password
              </Title>
              <Form layout="vertical" onFinish={onReset}>
                <Form.Item
                  label="New password"
                  name="password"
                  rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}
                >
                  <Input.Password placeholder="New password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Update password
                </Button>
              </Form>
              <Link to="/login" className="anchor d-inline-block mt-3">
                Back to sign in
              </Link>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
      <div className="authentication auth-split">
        <Row className="auth-split-row" gutter={0}>
          <Col xs={24} md={0} className="auth-mobile-bar">
            <span className="auth-mobile-bar__title">Pulsed</span>
          </Col>
          <Col xs={0} md={12} className="auth-split-brand">
          <Text className="auth-brand-kicker">Studio platform</Text>
          <Title level={2}>Train with clarity</Title>
          <Text className="auth-brand-tagline">
            Book Mat Pilates, Reformer, and personal training in one place. Manage packages, schedules,
            and reminders without friction.
          </Text>
          <Link to="/packages">
            <i className="ri-arrow-right-line" aria-hidden />
            View membership packages
          </Link>
        </Col>
        <Col xs={24} md={12} className="auth-split-form">
          <Card className="auth-panel" bordered={false}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'login',
                  label: 'Login',
                  children: (
                    <Form layout="vertical" onFinish={onLogin}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, type: 'email' }]}
                      >
                        <Input placeholder="Email" />
                      </Form.Item>
                      <Form.Item label="Password" name="password" rules={[{ required: true }]}>
                        <Input.Password placeholder="Password" />
                      </Form.Item>
                      <Form.Item name="remember" valuePropName="checked">
                        <Checkbox>Remember me</Checkbox>
                      </Form.Item>
                      <Button type="link" className="p-0 mb-2" onClick={() => setForgotOpen(true)}>
                        Forgot password?
                      </Button>
                      <Button type="primary" htmlType="submit" block>
                        Sign in
                      </Button>
                    </Form>
                  ),
                },
                {
                  key: 'signup',
                  label: invite ? 'Trainer signup' : 'Sign up',
                  children: (
                    <Form layout="vertical" onFinish={onSignup}>
                      {invite && (
                        <Text type="warning" className="d-block mb-2">
                          Registering as trainer with invite.
                        </Text>
                      )}
                      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                        <Input placeholder="Full name" />
                      </Form.Item>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, type: 'email' }]}
                      >
                        <Input placeholder="Email" />
                      </Form.Item>
                      <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                          { required: true },
                          {
                            validator(_, v) {
                              if (v && v.length < 8) return Promise.reject('Min 8 characters');
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input.Password
                          placeholder="Password"
                          onChange={(e) => setPwSignup(e.target.value)}
                        />
                      </Form.Item>
                      <div className="mb-3">
                        <Text type="secondary">Strength</Text>
                        <Progress percent={score} showInfo={false} strokeColor="#52c41a" />
                      </div>
                      <Button type="primary" htmlType="submit" block>
                        Create account
                      </Button>
                    </Form>
                  ),
                },
              ]}
            />
            <Button className="auth-google-btn mt-2" block disabled title="Configure Google OAuth to enable">
              Continue with Google — coming soon
            </Button>
            <Modal
              title="Reset password"
              open={forgotOpen}
              onCancel={() => setForgotOpen(false)}
              footer={null}
              destroyOnClose
            >
              <Form layout="vertical" onFinish={onForgot}>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                  <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Send reset link
                </Button>
              </Form>
            </Modal>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
