import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios';
import { setUser } from '../redux/userSlice';
import {showLoading , hideLoading} from '../redux/alertSlice';


function ProtectedRoute(props) {
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const getUser = async () => {
        try {
            dispatch(showLoading());
            const response = await axios.post(
                '/api/user/get-user-info-by-id',
                { token: localStorage.getItem('token') },
                {
                    headers: {
                        Authorization: `bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            dispatch(hideLoading());
            if (response.data.success) {
                dispatch(setUser(response.data.data));
            } else {
                localStorage.clear();
                navigate('/login');
            }
        } catch (error) {
            localStorage.clear();
            navigate('/login');
            dispatch(hideLoading());
        }
    };

    useEffect(() => {
        if (!user) {
            getUser();
        }
    }, [user, navigate]); 

    if (localStorage.getItem('token')) {
        return props.children;
    } else {
        navigate('/login'); 
        
    }
}

export default ProtectedRoute;