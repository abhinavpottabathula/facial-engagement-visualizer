import React from 'react';
import './styles/app.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Webcam from './visualizations/webcam';


function App() {
  return (
    <div className="App">
      <div style={{textAlign: "center"}}>
        <h1>Engagement Tracker</h1>
        <Webcam/>
      </div>
    </div>
  );
}

export default App;
