import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import RoutesComponent from './app.tsx';
import './index.css';
import { createPortal } from 'react-dom';
import { Toaster } from '@client/src/components/ui/sonner';

const CLIENT_BASE_PATH = '/';

// 通用错误显示组件（不依赖平台SDK）
const SimpleErrorRender = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
    <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>应用运行出错</h2>
    <p style={{ color: '#6b7280', marginBottom: '20px', wordBreak: 'break-all' }}>
      {error?.message || '发生未知错误'}
    </p>
    <button
      onClick={resetErrorBoundary}
      style={{
        padding: '8px 24px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      重试
    </button>
  </div>
);

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <SimpleErrorRender error={error as Error} resetErrorBoundary={resetErrorBoundary} />
          )}
        >
          <RoutesComponent />
          {createPortal(<Toaster />, document.body)}
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
