import React, {Component} from 'react';

import './tree-builder.css';

class TreeBuilder extends Component {
  state = {nodes: []};

  addNode = () => {
    console.log('tree-builder.js addNode: entered');
  };

  render() {
    return (
      <div className="tree-builder">
        <div className="add-btn" onClick={this.addNode}>+</div>
      </div>
    );
  }
}

export default TreeBuilder;
