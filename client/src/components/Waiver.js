import React, { useMemo, useState } from 'react';
import Layout from './Layout';
import {
  Modal,
  Form,
  Button,
  Input,
  Checkbox,
  Divider,
  Typography,
  Row,
  Col,
  Card,
  Alert,
  Space,
} from 'antd';
import { CheckCircleOutlined, FileProtectOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { showLoading, hideLoading } from '../redux/alertSlice';
import toast from 'react-hot-toast';
import api from '../api/client';
import { setUser } from '../redux/userSlice';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const WAIVER_CLAUSES = [
  {
    title: 'Assumption of risk',
    body: 'Physical activity carries inherent risk of injury. You confirm that you are voluntarily participating in classes and training sessions offered through Pulsed, and that you are in sufficient health to do so or have cleared participation with a qualified medical professional.',
  },
  {
    title: 'Release of liability',
    body: 'To the fullest extent permitted by law, you release Pulsed, its trainers, staff, and representatives from liability for any injury, loss, or damage arising from participation, except where such limitation is prohibited by law.',
  },
  {
    title: 'Accurate disclosure',
    body: 'You agree to disclose physical limitations, medical conditions, or other factors that may affect safe participation. You will update the studio if your condition changes.',
  },
  {
    title: 'Emergency contact',
    body: 'You provide a reachable emergency contact who may be notified if you require assistance during a session.',
  },
];

const Waiver = () => {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.user);

  const signed = user?.hasSignedWaiver?.signedwaiver;
  const waiverMeta = user?.hasSignedWaiver;

  const signWaiver = async (values) => {
    try {
      dispatch(showLoading());
      const response = await api.put('/api/auth/waiver', {
        signature: values.signature,
        emergencyContactName: values.emergencyName,
        emergencyContactEmailorPhone: values.emergencyContact,
        physicalLimits: values.physicalLimits?.trim() || 'none',
      });
      dispatch(hideLoading());
      if (response.data.success) {
        dispatch(setUser(response.data.data));
        toast.success('Waiver signed successfully');
        setVisible(false);
        form.resetFields();
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error(error.response?.data?.error || 'Could not submit waiver');
    }
  };

  const openModal = () => {
    form.resetFields();
    form.setFieldsValue({ acknowledged: false });
    setVisible(true);
  };

  const summaryItems = useMemo(() => {
    if (!signed || !waiverMeta) return [];
    return [
      { label: 'Signed as', value: waiverMeta.signature || '—' },
      {
        label: 'Emergency contact',
        value: waiverMeta.emergencyContactInfo?.emergencyContactName || '—',
      },
      {
        label: 'Emergency reach',
        value: waiverMeta.emergencyContactInfo?.emergencyContactEmailorPhone || '—',
      },
      {
        label: 'Physical notes',
        value: waiverMeta.physicalLimits && waiverMeta.physicalLimits !== 'none' ? waiverMeta.physicalLimits : 'None reported',
      },
    ];
  }, [signed, waiverMeta]);

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header">
          <Title level={2}>Forms &amp; waivers</Title>
          <Paragraph type="secondary" className="page-subtitle mb-0">
            Liability waiver is required before booking your first class.
          </Paragraph>
        </header>

        {signed ? (
          <Card className="waiver-status-card mb-4">
            <Space align="start" size="large" wrap>
              <div className="waiver-status-card__icon">
                <CheckCircleOutlined />
              </div>
              <div>
                <Title level={4} style={{ marginTop: 0 }}>
                  Waiver on file
                </Title>
                <Text type="secondary">
                  Your signed agreement is active. Contact the studio if your health status or emergency
                  details change.
                </Text>
                <dl className="waiver-summary-list">
                  {summaryItems.map((row) => (
                    <div key={row.label} className="waiver-summary-list__row">
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Space>
          </Card>
        ) : (
          <Card className="waiver-prompt-card mb-4">
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={16}>
                <Space align="start">
                  <SafetyCertificateOutlined className="waiver-prompt-card__icon" />
                  <div>
                    <Title level={4} style={{ marginTop: 0 }}>
                      Liability waiver required
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      Review the full waiver, add your emergency contact, then sign electronically with your
                      full legal name.
                    </Paragraph>
                  </div>
                </Space>
              </Col>
              <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                <Button type="primary" size="large" icon={<FileProtectOutlined />} onClick={openModal}>
                  Start waiver
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        <Modal
          title={
            <Space>
              <FileProtectOutlined />
              <span>Liability waiver &amp; release</span>
            </Space>
          }
          open={visible}
          onCancel={() => setVisible(false)}
          footer={null}
          width={720}
          destroyOnClose
          className="waiver-modal"
          styles={{ body: { maxHeight: 'min(85vh, 720px)', overflowY: 'auto', paddingTop: 8 } }}
        >
          <Alert
            type="info"
            showIcon
            className="mb-3"
            message="Please read each section before completing the form below."
          />

          <div className="waiver-clauses">
            {WAIVER_CLAUSES.map((c, i) => (
              <section key={c.title} className="waiver-clause">
                <Text strong className="waiver-clause__title">
                  {i + 1}. {c.title}
                </Text>
                <Paragraph className="waiver-clause__body">{c.body}</Paragraph>
              </section>
            ))}
          </div>

          <Divider orientation="left">Your details</Divider>

          <Form
            form={form}
            layout="vertical"
            requiredMark="optional"
            onFinish={signWaiver}
            scrollToFirstError
          >
            <Form.Item
              name="acknowledged"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, v) =>
                    v ? Promise.resolve() : Promise.reject(new Error('Confirm you have read the waiver')),
                },
              ]}
            >
              <Checkbox>
                I have read and understood this waiver and agree to be bound by its terms.
              </Checkbox>
            </Form.Item>

            <Title level={5}>Emergency contact</Title>
            <Text type="secondary" className="d-block mb-3">
              Someone we can reach if you need assistance during a session.
            </Text>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Full name"
                  name="emergencyName"
                  rules={[{ required: true, message: 'Emergency contact name is required' }]}
                >
                  <Input placeholder="Jane Doe" autoComplete="name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Phone or email"
                  name="emergencyContact"
                  rules={[{ required: true, message: 'Phone or email is required' }]}
                >
                  <Input placeholder="+1… or email" autoComplete="tel" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Physical limitations or medical notes"
              name="physicalLimits"
              extra="List injuries, conditions, or restrictions your trainer should know. Write “None” if not applicable."
            >
              <TextArea rows={3} placeholder="e.g. Lower back sensitivity — avoid deep flexion" maxLength={500} showCount />
            </Form.Item>

            <Divider orientation="left">Electronic signature</Divider>
            <Form.Item
              label="Type your full legal name"
              name="signature"
              rules={[{ required: true, message: 'Signature is required' }, { min: 2, message: 'Enter your full name' }]}
            >
              <Input placeholder="Same as on government ID" size="large" />
            </Form.Item>

            <Space className="waiver-modal__actions" wrap>
              <Button type="primary" htmlType="submit" size="large">
                Submit signed waiver
              </Button>
              <Button size="large" onClick={() => setVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Waiver;
