import React from 'react';
import Plot from 'react-plotly.js';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

const SAMPLING_RATE = 2000;

export default class PlotEx extends React.Component {
  state = {
    line1: {
      x: [],
      y: [], 
      name: 'LSL',
      line: {shape: 'spline'}
    },
    layout: { 
      xaxis:{title: 'Time'},
      yaxis:{title: 'LSL Inference Score'},
      datarevision: 0,
    },
    revision: 0,
    isConnected: false,
    isTaskStarted: false,
    connectionStatus: "Not Connected",
    taskStatus: "Start Task",
    streamsList: [],
    streamName: "None",
    updateIntervalId: null
  };

  getStreams = () => {
    fetch("http://localhost:9000/lsl/getStreams")
      .then(res => res.json())
      .then(res => this.setState({
        streamsList: res['streams']
      })
    );
  }

  connect(streamName) {
    fetch("http://localhost:9000/lsl/connect/" + streamName)
        .then(res => res.text())
        .then(res => {
          this.setState({isConnected: true, connectionStatus: "Connected to " + streamName});
        });
  }

  disconnect() {
    this.stopTask();
    fetch("http://localhost:9000/lsl/stop")
      .then(res => res.text())
      .then(res => {
        clearInterval(this.state.updateIntervalId);
        this.setState({isConnected: false, connectionStatus: "Not Connected"});
      });
  }
  
  getScore = () => {
    fetch("http://localhost:9000/lsl/getData")
      .then(res => res.json())
      .then(res => {
        const { line1, layout} = this.state;
        var curScore = parseFloat(res['score']);
        var curTime = parseInt(res['timestamp']);
        if (curTime != -1) {
          var i = line1.x.length - 1;
          while (i >= 0 && line1.x[i] > curTime) {
            i--;
          }
          line1.x.splice(i + 1, 0, curTime);
          line1.y.splice(i + 1, 0, curScore);
          line1.line.shape = 'spline';
        }
        this.setState({ revision: this.state.revision + 1 });
        layout.datarevision = this.state.revision + 1;
    });
  }

  startTask() {
    this.setState({isTaskStarted: true, taskStatus: "Stop Task", updateIntervalId: setInterval(this.updateScore, SAMPLING_RATE)});
  }

  stopTask() {
    clearInterval(this.state.updateIntervalId);
    this.setState({isTaskStarted: false, taskStatus: "Start Task", updateIntervalId: null});
  }

  updateScore = () => {
    if (this.state.isConnected) {
      this.getScore();
    }
  }

  // componentDidMount() {
  //   setInterval(this.updateScore, 4000);
  // }


  dropdownSelected = (name) => {
    this.setState({streamName: name});
    if (this.state.isConnected) {
      this.disconnect();
    }
    this.connect(name);
  }

  toggleTask = () => {
    if (!this.state.isConnected) {
      return;
    }

    if (this.state.isTaskStarted) {
      this.stopTask();
    } else {
      this.startTask();
    }
  }

  render() {  
    return (
      <div>
        <div>
          <Dropdown onClick={this.getStreams}>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
              Select LSL Device
            </Dropdown.Toggle>
          
            <Dropdown.Menu>
              {
                this.state.streamsList.map((streamName, i) => (
                  <Dropdown.Item key={i} onClick={this.dropdownSelected.bind(this, (streamName))}>{streamName}</Dropdown.Item>
                ))
              }
            </Dropdown.Menu>
          </Dropdown>
          <p>
            {this.state.connectionStatus}
          </p>
        </div>
        
        <div>
          <Button variant="primary" onClick={this.toggleTask}>
          {this.state.taskStatus}
          </Button>
        </div>
        
        <Plot 
          data={[
            this.state.line1
          ]}
          layout={this.state.layout}
          revision={this.state.revision}
          graphDiv="graph"
        />
      </div>
    );
  }
}