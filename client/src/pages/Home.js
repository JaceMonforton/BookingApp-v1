import React, { useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Calendar } from 'antd';
import { useSelector } from 'react-redux';
import ClassesComponent from '../components/Classes';
function Home() {

    const getData = async() => {
        try {
            const response = await axios.post('/api/user/get-user-info-by-id', {} ,
            {
               headers : {
                    Authorization : `Bearer ` + localStorage.getItem('token')
                }
            })
            console.log(response.data)
        } catch (error) {
            
        }
    }
    useEffect(()=> {

        getData();

    }, [] )

    {/*List of classes in form of cards with details (Trainer, date, time, focus, spots left) on each class, Register button.  */}
    {/*  Onclick of Register, pass user to "registered users" (isRegistered state?) for the class and notify the trainer that a user has signed up. */}

    {/* If Trainer OR Admin, allow to modify and add classes to the calendar */}

  return (
    <Layout>
      <h1 className='page-title'>Upcoming Classes</h1>

      <div className='sessions-container'>
        
          <Calendar/>
          

      </div>      

    </Layout>
  )
}

export default Home
