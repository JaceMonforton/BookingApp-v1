import { Form, Input, Button } from 'antd';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { hideLoading, showLoading } from '../redux/alertSlice';
function Login() {  
  
  const Navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async(values) => {
  
    try {
       dispatch(showLoading());
       const response = await axios.post('/api/user/login' , values);
       dispatch(hideLoading());
 
       if(response.data.success) 
       {
           toast.success(response.data.message);
           toast("Flying to the Home Page");
           localStorage.setItem("token" , response.data.data);
           Navigate("/");      

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
          Welcome Back!
        </h1>

        <Form layout="vertical" onFinish={onFinish}>
          
          <Form.Item label="Email" name="email" style={{ display: 'flex', justifyContent: 'center' }}>
            
            <Input type="email" placeholder="Enter Email" />
          </Form.Item>
          <Form.Item label="Password" name="password" style={{ display: 'flex', justifyContent: 'center' }}>
            
            <Input type="password" placeholder="Password" />
          </Form.Item>
          <Button type='primary' className="primary-button mt-2" htmlType="submit">
            Login
          </Button>
        </Form>

        <Link to="/register" className="anchor mt-2">
          Create An Account?
        </Link>

      </div>
    </div>
  );
}

export default Login;
