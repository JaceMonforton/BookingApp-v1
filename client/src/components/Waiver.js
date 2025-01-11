import React from 'react'
import Layout from './Layout';
import {Modal, Form, Button, Input, InputItem} from 'antd'
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showLoading, hideLoading } from '../redux/alertSlice';
import toast from 'react-hot-toast';
import axios from 'axios'
const Waiver = () => {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [signedWaiver, setSignedWaiver] = useState(user?.hasSignedWaiver?.signedwaiver || false);

  const signWaiver = async (values) => {
    
    try {
      dispatch(showLoading());
      
      const response = await axios.post(`/api/user/${user._id}/signed-waiver`, {
        hasSignedWaiver: {
          signedwaiver: true,
          emergencyContactInfo: {
            emergencyContactName: values.name,
            emergencyContactEmailorPhone: values.Contact,
          },
          physicalLimits: values.issues || "none",
          signature: values.signature,
        },
      });
      console.log(response.data)
      if (response.status === 200) {
        setSignedWaiver(true);
        toast.success("Signed Waiver Successfully");
        dispatch(hideLoading());
      } else {
        throw new Error(`Error ${response.status}: ${response.data.error}`);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error('Error signing waiver:', error.message);
      
      toast.error("Error signing waiver. Please try again.");
    }
  };
  
      const showForm = () => {
        setVisible(true);
      }
      const hideForm = () => {
        setVisible(false);
      }

      const cancelForm = () => {
        alert('You must Accept to Book Classes')
        localStorage.removeItem('token');
        window.location.reload();
      }


  return (
<Layout>

        <h1 className='page-title d-flex'>My Forms</h1>
        <Button type="primary" onClick={() => showForm()}>
                Waiver
            </Button>
        
            <Modal 
            
            title="My Forms" open={visible} onCancel={hideForm} footer={null}>
            <div className='modal-container'>
                <div className='authentication-form '>

        <Form layout="vertical" onFinish={signWaiver}>
    <hr/>
        <Form.Item required label="Emergency Contact" name="name" style={{ display: 'flex' }}>
            
            <Input  type="text" placeholder="Name" />
          </Form.Item>
        <Form.Item required label="" name="Contact" style={{ display: 'flex' }}>
            
            <Input type="text"  placeholder="Phone Number Or Email" />
          </Form.Item>
          <hr/>
          <Form.Item required label="Physical Issues" name="issues" style={{ display: 'flex' }}>
            
            <Input type="text" placeholder="Limitations we should be aware of " />
          </Form.Item>
          <hr/>
        <p className='d-flex p-2'>
          I, the undersigned, being aware of my own health and physical condition, and having
          knowledge that my participation in any exercise program may be injurious to my health, am
          voluntarily participating in physical activity with Tara Monforton PTS, Personal Training, Group
          Training and Team Training.
          Having such knowledge, I hereby release Tara Monforton PTS, Personal Training, Group
          Training and Team Training, their representatives, agents, and successors from liability for
          accidental injury or illness which I may incur as a result of participating in the said physical
          activity. I hereby assume all risks connected therewith and consent to participate in said
          program.
          I agree to disclose any physical limitations, disabilities, ailments, or impairments which may
          affect my ability to participate in said fitness program.
        </p>
        <Form.Item required label="Signature" name="signature" style={{ display: 'flex' }}>
            
            <Input  type="text" placeholder="Full Name" />
          </Form.Item>
        <Button type='primary' className="primary-button" htmlType="submit">
        Accept
        </Button>


        {!user?.hasSigendWaiver &&
        <Button danger className='primary-button' onClick={() => cancelForm()}>
            Decline 
        </Button>

        }
        </Form>

        </div>
    </div>


      </Modal>


</Layout>
  )
}

export default Waiver
