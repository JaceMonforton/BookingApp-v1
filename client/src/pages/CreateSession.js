import React from 'react';
import Layout from '../components/Layout';
import { Button, Col, Form, Input, Row } from 'antd';
import axios from 'axios';
import { showLoading, hideLoading } from '../redux/alertSlice';
import toast from 'react-hot-toast';
import { Dispatch } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ClassesComponent from '../components/Classes';
function CreateSession() {

    const {user} = useSelector((state) => state.user)
    const dispatch = useDispatch();
    const navigate = useNavigate();


    const onFinish = async(values) => {
        
        try {
            dispatch(showLoading())
            const response = await axios.post('/api/trainer/sessions' ,
            {
                ...values, 
            } , {
                headers : {
                    Authorization : `Bearer ${localStorage.getItem('token')} `,
                }
            });

            
            if(response.data.success) 
            {
                dispatch(hideLoading())
                toast.success("Class Sucesfully Created")
                navigate('/')
            } 
            else
            {
              toast.error(response.data.message);
              dispatch(hideLoading())
            }
         } 
         catch {
            dispatch(hideLoading())

            toast.error("Something Went Wrong");
      
         }
     } //onfinish function

  return (

    <Layout>

     {(user?.isTrainer || user?.isAdmin) &&    
        <Form layout='vertical' onFinish={onFinish}>

                <h1 className='page-title'>New Class</h1>
                <hr/>
                <h2 className='card-title'>Session Info</h2>
                <Row gutter={24}>
                    <Col span={8} xs={24} sm={24} lg={8}>
                        <Form.Item 
                        required 
                        label='Class-Title' 
                        name='classTitle' 
                        rules={[{ required: true }]}>
                            <Input type='text' placeholder='Enter Class Title'/>
                        </Form.Item>
                    </Col>
                    <Col span={8} xs={24} sm={24} lg={8}>
                        <Form.Item
                            
                            label='Fee'
                            name='fee'
                            rules={[{ required: false }]}
                        >
                            <Input placeholder='$' type='Number'/>
                        </Form.Item>
                    </Col>
                </Row>
                <hr />
                <h1 className='card-title'>Additional Info</h1>

                <Row gutter={20}>
                    <Col span={8} xs={24} sm={24} lg={8}>
                        <Form.Item
                            required
                            label='Gym'
                            name='gym'
                            rules={[{ required: true, message: 'Please enter gym' }]}
                        >
                            <Input placeholder='Ex: "F-45 @ Oshawa"' />
                        </Form.Item>
                    </Col>

                    <Col span={8} xs={24} sm={24} lg={8}>
                        <Form.Item
                            required
                            label='Session Focus'
                            name='focus'
                            rules={[{ required: true, message: 'Please enter your exercise focus' }]}
                        >
                            <Input placeholder='Strength, Crossfit, Etc' />
                        </Form.Item>
                    </Col>
                    <Col span={8} xs={24} sm={24} lg={8}>
                        <Form.Item 
                        required 
                        label='Limit' 
                        name='personLimit' 
                        rules={[{ required: true }]}>
                            <Input type='text' placeholder='Person Limit'/>
                        </Form.Item>
                    </Col>

                    <Col span={8} xs={24} sm={24} lg={8}>
                        <Form.Item
                            required
                            label='Date'
                            name='date'
                            rules={[{ required: true }]}
                        >
                            <Input placeholder='Day' type='date'/>
                        </Form.Item>
                    </Col>
                </Row>  
                <Row gutter={24}>

                    <Col span={8} xs={24} sm={24} lg={8}>
                        <Form.Item
                            required
                            label='Start Time'
                            name='startTime'
                            rules={[{ required: true }]}
                        >
                            <Input placeholder='time' type='time'/>

                        </Form.Item>
                    </Col>
                    <Col span={8} xs={24} sm={24} lg={8}>
                        <Form.Item
                            required
                            label='End Time'
                            name='endTime'
                            rules={[{ required: true }]}
                        >
                            <Input placeholder='time' type='time'/>
                        </Form.Item>
                    </Col>

                </Row>

                <div className='d-flex justify-content-end'>
                    <Button type='primary' htmlType='submit'>
                        Create!
                    </Button>
                </div>
                        <hr/>
            </Form>

}
{(user?.isAdmin) || (user?.isTrainer) && <div className='page-title'> Created Classes
<hr/> </div> } { user && <ClassesComponent/>
}

    
    </Layout>
  )
}

export default CreateSession
