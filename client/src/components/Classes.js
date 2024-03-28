import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, Modal, List } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import { hideLoading, showLoading } from '../redux/alertSlice';
import moment from 'moment';

function ClassesComponent() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [sessions, setSessions] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedUserForDeletion, setSelectedUserForDeletion] = useState(null);
  const dispatch = useDispatch();
  const initialSessionsRef = useRef(sessions);

  const fetchSessions = useCallback(async () => {
    try {
      dispatch(showLoading());

      const response = await fetch('/api/trainer/sessions');
      const data = await response.json();
      console.log('Fetched sessions:', data);
      dispatch(hideLoading());

      setSessions(data);
    } catch (error) {
      dispatch(hideLoading());
      console.error('Error fetching sessions:', error);
    }
  }, [dispatch]);


  const onDelete = async (sessionId) => {
    console.log('Deleting Session with ID:', sessionId);
    try {
      dispatch(showLoading())
      const response = await axios.delete(`/api/trainer/sessions/${sessionId}`, {
        headers : {
          Authorization : `Bearer ` + localStorage.getItem('token')
      }
      });
      console.log('Session deleted successfully:', response.data);
      toast.success("Session Deleted")
      dispatch(hideLoading())

      setSessions((prevSessions) =>
        prevSessions.filter((session) => session._id !== sessionId)
      );
    } catch (error) {
      dispatch(hideLoading())
      console.error('Error deleting session:', error.message);
      toast.error("Error Deletinig")
    }
  };

  const onRegister = async (sessionId) => {

    try {
      dispatch(showLoading());
  
      const sessionDetailsResponse = await axios.get(`/api/trainer/sessions/${sessionId}`);
      const sessionDetails = sessionDetailsResponse.data;

  
      if (sessionDetails.registeredUsers.length >= sessionDetails.personLimit) {
        toast.error("This session is already full.");
        dispatch(hideLoading());
        return;
      }
      
      console.log('Registering for session with ID:', sessionId);
      const response = await axios.post(`/api/trainer/sessions/${sessionId}/register/`, {
        userId: user._id,
        name: `${user.name}`,
      });
      console.log('Registration successful:', response.data);
      dispatch(hideLoading());
      toast.success('Successfully Registered');
  
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session._id === sessionId
            ? { ...session, registeredUsers: [...session.registeredUsers, user] }
            : session
        )
      );
  
    } catch (error) {
      dispatch(hideLoading());
      console.error('Error registering for session:', error.message);
      toast.error("Error, May Already Be Registered Or Need To Sign Waiver");
      if (!user.hasSignedWaiver) {
        navigate('/forms')
      }
    }
  };
  
  const showDetails = async (session) => {
    try {

      const response = await axios.get(`/api/trainer/sessions/${session._id}`);
      const detailedSession = response.data;
  
      setSelectedSession(detailedSession);
      setVisible(true);
    } catch (error) {
      console.error('Error fetching session details:', error.message);
    }
  };
  
  const hideDetails = () => {
    setSelectedSession(null);
    setVisible(false);
  };
  

  const deleteExpiredSessions = async () => {
    try {
      dispatch(showLoading());
  
      const expiredSessions = sessions.filter(session =>
        moment(session.date).isBefore(moment().subtract(1, 'days'))
      );
  
      const deleteSession = async (url) => {
        await axios.delete(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      };
  
      for (const session of expiredSessions) {
        await Promise.all([
          deleteSession(`/api/user/sessions/${session._id}/${user._id}/cancel`),
          deleteSession(`/api/user/sessions/${session._id}`),
          deleteSession(`/api/trainer/sessions/${session._id}`),
        ]);
      }
  
      // Fetch sessions again after deletion
      await fetchSessions();
  
      dispatch(hideLoading());
      toast.success("Deleted Expired Sessions");
    } catch (error) {
      dispatch(hideLoading());
      console.error('Error deleting expired sessions and related data:', error.message);
      toast.error("Error Deleting Expired Sessions");
    }
  };
  

  useEffect(() => {
    const init = async () => {
      try {
        const Today = new Date();
        console.log(Today);
        dispatch(showLoading());
  
        await fetchSessions();
        await deleteExpiredSessions(); 
        dispatch(hideLoading());
      } catch (error) {
        dispatch(hideLoading());
        console.error('Error fetching sessions:', error);
      }
    };
  
    init();
  }, []);
  
  return (
    <div className="class-cards">
      {sessions.map((session) => (
        <Card
          key={session._id}
          title={session.classTitle}
          style={{ width: 300, margin: '16px' }}
          extra={
            (user?.isTrainer || user?.isAdmin) && (
              <>
                <Button type="primary" onClick={() => showDetails(session)}>
                  Details
                </Button>

                <Button danger onClick={() => onDelete(session._id)}>
                  Cancel
                </Button>
              </>
            )
          } 
        >
          <h6 className='card2-title'>Spots Left: {session.personLimit-session.registeredUsers.length}/{session.personLimit} </h6>

          <p className='card3-title'>Date: {session.date}</p>
          <p className='card3-title'>Time: {session.startTime} - {session.endTime}</p>
          <p className='card3-title'>Gym: {session.gym}</p>
          <p className='card3-title'>Focus: {session.focus}</p>
          <p className='card3-title'>Registration Fee: ${session.fee}</p>

          <Button type="primary" onClick={() => onRegister(session._id)}>
            Register
          </Button>
        </Card>
      ))} 










<Modal title="Registered Users" open={visible} onCancel={hideDetails} footer={null}>
{selectedSession ? (
  selectedSession.registeredUsers && selectedSession.registeredUsers.length > 0 ? (
    <List
      dataSource={selectedSession.registeredUsers}
      renderItem={(user) => (
        <List.Item>
          {user.name}{' '}
        </List.Item>        
      )}
    />
  ) : (
    <p>No registered users for this session.</p>
  )
) : ( 
  <div>
    {dispatch(hideLoading)}
    <p>Loading session details...</p>
  </div>
)}

    </Modal>





      


    </div>
  );
}

export default ClassesComponent;
