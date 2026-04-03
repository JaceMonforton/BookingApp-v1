import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Input, Row, Select, DatePicker, Switch } from 'antd';
import api from '../api/client';
import { showLoading, hideLoading } from '../redux/alertSlice';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

/**
 * @param {object} props
 * @param {object} props.user – Redux user (trainer or admin)
 * @param {() => void} [props.onSuccess] – after successful create
 */
export default function CreateSessionForm({ user, onSuccess }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api
        .get('/api/auth/trainers')
        .then((res) => {
          if (res.data.success) setTrainers(res.data.data || []);
        })
        .catch(() => {});
    }
  }, [user?.role]);

  const onFinish = async (values) => {
    try {
      dispatch(showLoading());
      const payload = {
        type: values.type,
        isZoom: !!values.isZoom,
        zoomLink: values.zoomLink || '',
        trainer: user.role === 'trainer' ? user._id : values.trainer,
        startTime: values.startTime.toDate(),
        endTime: values.endTime.toDate(),
        maxCapacity: values.maxCapacity ? Number(values.maxCapacity) : undefined,
        notes: values.notes || '',
      };
      const response = await api.post('/api/sessions', payload);
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success('Session created');
        form.resetFields();
        onSuccess?.();
      } else {
        toast.error(response.data.error || 'Failed');
      }
    } catch (e) {
      dispatch(hideLoading());
      toast.error(e.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name="type" label="Class type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'mat_pilates', label: 'Mat Pilates' },
                { value: 'reformer', label: 'Reformer' },
                { value: 'personal_training', label: 'Personal Training' },
              ]}
            />
          </Form.Item>
        </Col>
        {user?.role === 'admin' && (
          <Col xs={24} md={12}>
            <Form.Item name="trainer" label="Trainer" rules={[{ required: true }]}>
              <Select
                placeholder="Select trainer"
                options={trainers.map((t) => ({ value: t._id, label: `${t.name} (${t.email})` }))}
              />
            </Form.Item>
          </Col>
        )}
      </Row>
      <Form.Item label="Zoom" name="isZoom" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item name="zoomLink" label="Zoom link">
        <Input placeholder="https://..." />
      </Form.Item>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name="startTime" label="Start" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="endTime" label="End" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="maxCapacity" label="Max clients (optional — defaults by type)">
        <Input type="number" min={1} max={10} />
      </Form.Item>
      <Form.Item name="notes" label="Notes">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Button type="primary" htmlType="submit" size="large">
        Create session
      </Button>
    </Form>
  );
}
