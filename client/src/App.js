import React from 'react';
import './styles/app.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Line from './visualizations/line';

function App() {
  return (
    <div className="App">
      <div style={{textAlign: "center"}}>
        <h1>Line Plotter</h1>
        <Line/>
      </div>
    </div>
  );
}

export default App;
