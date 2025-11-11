import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Home = () => {
  const { logoutUser } = useContext(AppContext);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#282c34' }}>
      <button
        onClick={() => logoutUser()}
        style={{
          backgroundColor: '#fff',   // white background
          color: '#282c34',          // dark text
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Home;
