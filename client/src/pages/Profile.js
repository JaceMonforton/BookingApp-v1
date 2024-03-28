import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Layout from '../components/Layout';
import { Button, Card, Modal } from 'antd';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '../redux/alertSlice';
import toast from 'react-hot-toast'

const Profile = () => {

  const [registeredClasses, setRegisteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchRegisteredClasses = async () => {
      try {
        dispatch(showLoading())
        console.log('Fetching registered classes...');
        const response = await fetch(`/api/user/${user._id}/registered-classes`);
        dispatch(hideLoading())
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found or no registered classes');
          } else {
            throw new Error(`Failed to fetch registered classes. Status: ${response.status}`);
          }
        }
        dispatch(hideLoading())
        console.log('Fetched registered classes:', user.registeredClasses);

        if (!user || !user.registeredClasses || !Array.isArray(user.registeredClasses)) {
          throw new Error('Invalid data structure received from the server');
        }

        setRegisteredClasses(user.registeredClasses.filter(session => session !== null));
      } catch (error) {
        dispatch(hideLoading());
        console.error('Error fetching registered classes:', error);
        setError(error.message);
      } finally {
        setLoading(false);
        dispatch(hideLoading())
      }
    };

    if (user?._id) {
      fetchRegisteredClasses();
    } 

  }, [user?._id]);

  const handleCancel = async (session) => {
    try {
      if (!session || !session._id) {
        console.error('Invalid session object:', session);
        return;
      }
      
      dispatch(showLoading());
  
      const response = await fetch(`/api/trainer/sessions/${session._id}/${user._id}/cancel`, {
        method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
      
        toast.success("Session Cancelled Successfully!");
        toast.loading("Please Refresh")
        console.log('Session canceled successfully', session);
      } else {
        const errorMessage = await response.text(); 
        console.error(`Failed to cancel session. Status: ${response.status}, Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error handling cancel:', error);
    } finally {
      dispatch(hideLoading());
    }
  };
  



  return (
    
    <Layout>
    <>
      <h1 className='page-title d-flex'>My Classes</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className='error-message'>{error}</p>
      ) : user.registeredClasses.length === 0 ? (
        <p className='card-title'>No classes registered yet.</p>
      ) : (
        <ul>
          {user?.registeredClasses.map((session, index) => (
            <Card key={index} style={{ width: 600, margin: '16px' }} className='m-3 p-2'>
              {session ? (
                <React.Fragment>
                  <strong>{session.classTitle}</strong> 
                  <hr/> {session.date} 
                  <hr/> {session.startTime} to {session.endTime}
                  <hr/> {session.gym}
                  <hr/> 
                  <Button danger onClick={() => {
                    handleCancel(session) 
                  }
                    }>
                    Cancel?
                  </Button>
                </React.Fragment>
              ) : (
                <span>No session information available</span>
              )}
            </Card>
          ))}
        </ul>
      )}



      </> 

    </Layout>

             
  );
};

export default Profile;
