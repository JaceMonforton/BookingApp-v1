import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import axios from 'axios';
import { showLoading, hideLoading } from '../redux/alertSlice';
import { Button, Card } from 'antd';
import toast from 'react-hot-toast'

function Notifications() {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      dispatch(showLoading());
      console.log('Fetching Notifications...');
      const response = await axios.get(`/api/user/${user._id}/notifications`);

      if (!response.data || response.data.length === 0) {
        throw new Error('No Notifications found');
      }

      setNotifications(response.data);
      console.log('Fetched Notifications:', response.data);
    } catch (error) {
      console.error('Error fetching Notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      dispatch(hideLoading());
    }
  };

  const markNotificationsAsSeen = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.delete(`/api/user/${user._id}/notifications/delete`);

      if (!response.data || response.data.length === 0) {
        throw new Error('No Notifications found');
      }

      setNotifications(response.data);
      console.log('Marked Notifications as seen:', response.data);
      toast.success("Marked as Seen!")
    } catch (error) {
      console.error('Error marking Notifications as seen:', error);
      setError(error.message);
    } finally {
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
    }
  }, [user?._id]);

  return (
    <Layout>
      <h1 className='page-title'> My Notifications </h1>

      <div className='notifications'>
        {user?.unseenNotifications.map((unseenNotifications) => (
          <Card
            key={unseenNotifications._id} 
            title={unseenNotifications.type}
            style={{ width: 275, margin: '16px' }}
          >
            {unseenNotifications.message}
          </Card>
        ))}
      </div>

      <Button type='primary' onClick={markNotificationsAsSeen}>
        Mark All as Seen
      </Button>
    </Layout>
  );
}

export default Notifications;
