import React, { useState } from 'react';
import "../layout.css";
import "../index.css";
import { Link, useNavigate, useLocation, Navigate} from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Badge } from 'antd';
import Logo from  '../assets/KFW-Logo.png'
function Layout({children}) {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navitage = useNavigate();
    const {user} = useSelector((state) => state.user)

    const userMenu = [ 
        {
            name: "Home",
            path: '/', 
            icon: 'ri-home-line',
        },
        {
            name: "Profile",
            path: '/profile',
            icon: 'ri-account-box-line',
        },
        {
            name: 'Classes',
            path: '/sessions',
            icon: 'ri-file-list-2-line',
        },
        {
          name:'Forms',
          path: '/forms',
          icon: 'ri-survey-line'
        },

    ];

    const adminMenu = [
            {
                name: "Home",
                path: '/', 
                icon: 'ri-home-line',
            },
            {
              name: "Profile",
              path: '/profile',
              icon: 'ri-account-box-line',
            },
            {
              name: 'Classes',
              path: '/sessions',
              icon: 'ri-file-list-2-line',
          },
          {
            name:'Forms',
            path: '/forms',
            icon: 'ri-survey-line'
          },
        ];

        const trainerMenu = [
            {
                name: "Home",
                path: '/', 
                icon: 'ri-home-line',
            },
            {
                name: "Profile",
                path: "/profile",
                icon: 'ri-user-line',
            },
            {
                name: "Classes",
                path: "/sessions",
                icon: "ri-file-list-2-line",
            },
            {
              name:'Forms',
              path: '/forms',
              icon: 'ri-survey-line'
            },
        ];

    const menuToBeRendered = user?.isAdmin ? adminMenu : userMenu && user?.isTrainer ? trainerMenu : userMenu;  {/* Holy fuck kill me */}

    return (
        <div className='main'>
          <div className='d-flex layout'>
            <div className={`${collapsed ? 'collapsed-sidebar' : 'sidebar'}`}>
              <div className='sidebar-header'>
                <img className='logo' src={Logo} alt='KFW-Logo' />
              </div>
              <div className='menu d-flex-col'>
                {menuToBeRendered.map((menu) => (
                  <div className='menu-item' key={menu.name}>
                    <Link to={menu.path}>
                      <i className={menu.icon} />
                      {!collapsed && <span>{menu.name}</span>}
                    </Link>
                  </div>
                ))}
                <div
                  className='menu-item'
                  onClick={() => {
                    localStorage.clear();
                    navitage('/login');
                  }}
                > 
                  <Link to='/login'>
                    <i className='ri-logout-box-line' />
                    {!collapsed && <span>Logout</span>}
                  </Link>
                </div>
              </div>
            </div>
    
            { /* Header */ }

<div className='content'>
    <div className='header'>  
    {!collapsed ? <i className='ri-close-fill remix-icons'onClick={() =>{setCollapsed(true)}}> </i>
               : <i className='ri-menu-2-fill remix-icons'onClick={() =>{setCollapsed(false)}}> </i>
    }
    
    <div className='d-flex p-3'>
    <Link className='anchor' to={'/profile'}>{user?.name}</Link>
        <Badge onClick={() => navitage('/notifications')}count={user?.unseenNotifications.length}>
        <i className='ri-notification-line remix-icons px-2'></i>
        </Badge>    
        
    </div>

    </div>

    <div className='body'>    
     {children}
    </div>
</div>


</div>


</div>
)
}

export default Layout