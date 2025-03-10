import React from 'react';
import 'antd/dist/reset.css';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import Register from './pages/Register';
import Home from './pages/Home';
import { useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import CreateSession from './pages/CreateSession';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Waiver from './components/Waiver';
function App() {
  
  const {loading} = useSelector(state=> state.alerts)

  return (
   <BrowserRouter>

    {loading && (<div className='spinner-parent'>

      <div className='spinner-border' role='status'>
        
      </div>

    </div>)}
    
    <Toaster 
    position='top-center'
    reverseOrder={false}
    />

      <Routes>

        <Route path='/login' element={<PublicRoute> <Login /> </PublicRoute>} />
        <Route path='/register' element={<PublicRoute> <Register /> </PublicRoute>} />
        <Route path='/' element={<ProtectedRoute> <Home /> </ProtectedRoute>} />
        {/* <Route path='/apply-trainer' element={<ProtectedRoute> <ApplyTrainer /> </ProtectedRoute>} /> */}
        <Route path='/sessions' element={<ProtectedRoute> <CreateSession/> </ProtectedRoute>} />
        <Route path='/profile' element={<ProtectedRoute> <Profile/> </ProtectedRoute>} />
        {/* <Route path='/users' element={<ProtectedRoute> <Users/> </ProtectedRoute>} /> */}
        {/* <Route path='/trainers' element={<ProtectedRoute> <Trainers/> </ProtectedRoute>} /> */}
        <Route path='/notifications' element={<ProtectedRoute> <Notifications/> </ProtectedRoute>} />
        <Route path='/forms' element={<ProtectedRoute> <Waiver/> </ProtectedRoute>} />


        
      </Routes>

      </BrowserRouter>
  );
  
}

export default App;
