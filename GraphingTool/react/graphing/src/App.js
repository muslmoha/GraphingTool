import './App.css';
import { Component } from 'react';
import Plot from 'react-plotly.js';

class App extends Component{

  constructor(props){
    super(props);
    this.state={
      coefficients:[],
      dataX:[],
      dataY:[],
      xValues:[],
      yValues:[],
      max:Number.MIN_SAFE_INTEGER,
      min:Number.MAX_SAFE_INTEGER,
      order:1,
      x:0,
      y:0,
      equation:""
    }
  }


  API_URL="http://localhost:34983/";

  async parseCoefficients(){
   let dataSet = {
      xData: this.state.dataX,
      yData: this.state.dataY,
      polyOrder: this.state.order
    };

    let setLength = dataSet.xData.length;

    switch (dataSet.polyOrder){
      case 1:
        if(setLength < 2){
          alert("Linear Regression Requires Minimum 2 points");
          return;
        }
        break;
      case 2:
        if(setLength < 3){
          alert("Linear Regression Requires Minimum 3 points");
          return;
        }
        break;
      case 3:
        if(setLength < 4){
          alert("Linear Regression Requires Minimum 4 points");
          return;
        }
        break;
      default:
        break;
    }

    const jsonString = JSON.stringify(dataSet);

    await fetch(this.API_URL+"api/Calculate/GetEquation", {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Custom-Header': jsonString,
      },
    }).then(response => response.json()).then(
      coefficientRes => {
   const parsedCoefficients = coefficientRes.map((value) => Number(value));

    this.setState({
      coefficients: parsedCoefficients
    });
  });
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.order !== prevState.order){
      this.setOrder(this.state.order);
    }
    if(this.state.min !== prevState.min ||
      this.state.max !== prevState.max || 
      this.state.coefficients !== prevState.coefficients
      ){
      this.setMinMax();
      this.calculateYValues();
    }
    
  }

  calcSteps(min, max, numElements){
    const range = max - min;
    const step = range / (numElements - 1);
    return step;
  }

  calculateYValues(){
    if(this.state.coefficients.length === 0) return;

    let order = this.state.order;
    let cf = this.state.coefficients;
    let max = this.state.max;
    let min = this.state.min;
    let length = this.state.dataX.length;
    let step = this.calcSteps(min, max, 100);
    let xValues = [];

    for (let index = 0; index < 100+length; index++) {
      xValues.push(min);
      min+= step; 
    }
    xValues.push(max);

    let yValues = [];
    let eqn = "";

    for(let i = 0; i < cf.length; i++){
      if(isNaN(cf[i])){
        alert("Please enter at least 1 unique point");
        return;
      }
    }

    switch(order){
      case 1:
        yValues = xValues.map((x) => cf[1]*x + cf[0]);
        break;
      case 2:
        yValues = xValues.map((x) => cf[2]*x**2 + cf[1]*x + cf[0]);
        break;
      case 3:
        yValues = xValues.map((x) => cf[3]*x**3 + cf[2]*x**2 + cf[1]*x + cf[0]);
        break;
      default:
        alert("Error: Out of bounds");
    }

    eqn = this.equationBuilder(cf);

    this.setState({equation: eqn});
    this.setState({xValues: xValues});
    this.setState({yValues: yValues});
    
  }

  equationBuilder(cf){
    let terms = Array(4).fill(0);
    let eqn = "";
    const exponent2 = 'x\u00B2';
    const exponent3 = 'x\u00B3';

    cf.forEach((coefficient, index) => {
      terms[index] = coefficient;
    });

    if (terms[3] !== 0) {
      eqn += cf[3] + exponent3;
    }
  
    if (terms[2] !== 0) {
      if (eqn !== '') {
        eqn += ' + ';
      }
      eqn += cf[2] + exponent2;
    }
  
    if (terms[1] !== 0) {
      if (eqn !== '') {
        eqn += ' + ';
      }
      eqn += cf[1] + 'x';
    }
  
    if (terms[0] !== 0) {
      if (eqn !== '') {
        eqn += ' + ';
      }
      eqn += cf[0];
    }

    if(eqn === ""){
      return "0";
    }

    return eqn;
  
  }

  setMinMax(){
    this.setState({min: Math.min(...this.state.dataX)});
    this.setState({max: Math.max(...this.state.dataX)});
  }

  addDataPoints(newX, newY) {
    const parsedX = Number(newX);
    const parsedY = Number(newY);

    if (!isNaN(parsedX) && !isNaN(parsedY)) {
      this.setMinMax();
      this.setState(prevState => ({
        dataX: [...prevState.dataX, parsedX],
        dataY: [...prevState.dataY, parsedY]
      }));
    } 
    else {
      alert("Invalid data points. Please provide valid numbers.");
    }
  }

  setOrder(newOrder){
    const parsedOrder = Number(newOrder);

    if(!isNaN(parsedOrder)){
      this.setState({order: parsedOrder})
    }
    else {
      alert("Invalid order. Please provide valid numbers." + newOrder);
    }
  }

  deleteDataPoints(index){
    {
      const updatedXSet = [...this.state.dataX];
      const updatedYSet = [...this.state.dataY];
    
      updatedXSet.splice(index, 1);
      updatedYSet.splice(index, 1);

      this.setState(prevState => ({
        dataX: updatedXSet,
        dataY: updatedYSet
      }));
    };
  }

  clearGraph(){
    this.setState({xValues: []});
    this.setState({yValues: []});
    this.setState({equation: ""});
  }

  clearTable(){
    this.clearGraph();
    this.setState({dataX: []});
    this.setState({dataY: []});
    this.setState({max: 0});
    this.setState({min: 0});
  }

  render(){
    return (
      <div className="App">
        <header className="App-header">
          Data Graph - Mohammed Musleh
        </header>
        <body>
          <Plot
          data={[
            {type: 'scatter', mode: 'markers', x: this.state.dataX, y: this.state.dataY, name: "data set"},
            {type: 'scatter', mode: 'lines', x:this.state.xValues, y:this.state.yValues, name: 'Curve of Best Fit <br> Equation = '+ this.state.equation, line: { color: 'red', smoothing: 0.3} }
            ]}
            layout={ {width: 1000, height: 1000, title: 'Data Visualization'} }
            config={ { scrollZoom:true, style: { border: '5px solid #444' } } }
            id="plot"/>
            <p />
          <label>
            
            <label className='radio-container'>
              <input
                className='radio-order radio-order-left'
                type="radio"
                value={1}
                onChange={
                  (e) => {
                    this.setOrder(e.target.value)
                  }
                }
                checked={this.state.order === 1}
              />
              Linear
            </label>

            <label>
              <input
                className='radio-order'
                type="radio"
                value={2}
                onChange={
                  (e) => {
                    this.setOrder(e.target.value)
                  }
                }
                checked={this.state.order === 2}
              />
              Quadratic
            </label>

            <label>
              <input
                className='radio-order radio-order-right'
                type="radio"
                value={3}
                checked={this.state.order === 3}
                onChange={
                  (e) => {
                    this.setOrder(e.target.value)
                  }
                }
              />
              Cubic
            </label> 
          </label>
          <button className='graph-button' onClick={()=>this.parseCoefficients()}>plot</button>

          <button className='graph-button' onClick={(e) => {
                e.preventDefault();
                this.clearGraph();
                }}>
              Clear Graph
            </button>
          
          <form>
            <input type="number" onChange={(e) => this.setState({x: e.target.value})} placeholder="0" />
            <input type="number" onChange={(e) => this.setState({y: e.target.value})} placeholder="0" />
            <button className='table-button' onClick={(e) => {
                e.preventDefault();
                this.addDataPoints(this.state.x, this.state.y);
                }}>
              Add
            </button>

            <button className='table-button' onClick={(e) => {
                e.preventDefault();
                this.clearTable();
                }}>
              Clear Table
            </button>
          <p />

          </form>
          <table className='table'>
            <thead>
              <tr>
                <th>x</th>
                <th>y</th>
              </tr>
            </thead>
            <tbody>
              {this.state.dataX.map((x, index)=> 
                <tr>
                  <td>{x}</td>
                  <td>{this.state.dataY[index]}</td>
                  <td><button className='delete-button' onClick={(e) => {
                      e.preventDefault();
                      this.deleteDataPoints(index);
                    }}>Delete</button></td>
                </tr>
              )}
            </tbody>
          </table>

        </body> 
      </div>
    );
  }
}

export default App;