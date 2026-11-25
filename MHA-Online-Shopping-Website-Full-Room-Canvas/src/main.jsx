import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import { StoreProvider } from './context/StoreContext.jsx';
import App from './App.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px', fontFamily: 'system-ui', textAlign: 'center' }}>
          <h1>MHA Online Shopping</h1>
          <p>Something went wrong loading the page: {String(this.state.error.message || this.state.error)}</p>
          <button onClick={() => { localStorage.clear(); location.reload(); }}>Reset &amp; Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/">
        <StoreProvider>
          <App />
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
