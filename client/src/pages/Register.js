import { Form, Input } from 'antd';
import React from 'react';
import { Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import toast from 'react-hot-toast';
import { hideLoading, showLoading } from '../redux/alertSlice';
import {useDispatch} from 'react-redux';
function Register() {

  const Navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async(values) => {

   try {
      dispatch(showLoading());
      const response = await axios.post('api/user/register' , values);
      dispatch(hideLoading());
      if(response.data.success) 
      {
          toast.success(response.data.message);
          toast("Redirecting to Login Page");
          Navigate("/login")
      } 
      else
      {
        toast.error(response.data.message);
      }
   } 
   catch {
      toast.error("Something Went Wrong");
      dispatch(hideLoading());

   }

  };

  return (
    <div className="authentication">
      <div className="authentication-form card p-3">
        <h1
          className="card-title"
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          Let's Get Started!
        </h1>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Name" name="name" style={{ display: 'flex', justifyContent: 'center' }}>
            <Input placeholder="Enter Name" />
          </Form.Item>
          <Form.Item label="Email" name="email" style={{ display: 'flex', justifyContent: 'center' }}>
            {/* Added name attribute for the email field */}
            <Input type="email" placeholder="Enter Email" />
          </Form.Item>
          <Form.Item label="Password" name="password" style={{ display: 'flex', justifyContent: 'center' }}>
            {/* Added name attribute for the password field */}
            <Input type="password" placeholder="Password" />
          </Form.Item>
          <Button type='primary' className="primary-button mt-2" htmlType="submit">
            Register
          </Button>
        </Form>

        <Link to="/login" className="anchor mt-2">
          Click Here to Login
        </Link>
      </div>
    </div>
  );
}

export default Register;
