'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SnackbarProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      style={{
        fontSize: '14px',
      }}
      toastStyle={{
        backgroundColor: '#1c2127',
        color: '#ffffff',
        border: '1px solid #3b4854',
      }}
    />
  );
}
