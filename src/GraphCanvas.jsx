import React, { useEffect, useRef } from 'react';
import { LiteGraph } from 'litegraph.js';

const GraphCanvas = ({ workflow }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!workflow) return;

    const graph = new LiteGraph.LGraph();
    const canvas = new LiteGraph.LGraphCanvas(canvasRef.current, graph);

      canvas.showSearchBox = function() {
      };

    // Register "dummy" node types so the graph can visualize them
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      if (!LiteGraph.registered_node_types) {
        LiteGraph.registered_node_types = {};
      }

      const types = new Set(workflow.nodes.map((node) => node.type));
      types.forEach((type) => {
        if (!LiteGraph.registered_node_types[type]) {
          function MyNode() {}
          MyNode.title = type;
          LiteGraph.registerNodeType(type, MyNode);
        }
      });
    }

    // Configure the graph with the workflow data
    try {
      graph.configure(workflow);

      // After configuring, we can add text widgets for each node's settings
      if (workflow.nodes) {
        workflow.nodes.forEach((item) => {
          const node = graph.getNodeById(item.id);
          if (node && item.widgets_values && Array.isArray(item.widgets_values)) {
            item.widgets_values.forEach((val) => {
              node.addWidget("text", "", val);
            });
          }
        });
      }
    } catch (error) {
      console.error('Error configuring LiteGraph:', error);
    }

    // Resize the canvas to match its container
    const resizeCanvas = () => {
      canvasRef.current.width = canvasRef.current.offsetWidth;
      canvasRef.current.height = canvasRef.current.offsetHeight;
      canvas.draw(true, true);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Start the graph
    graph.start();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      graph.stop();
      graph.clear();
      graph.detachCanvas();
    };
    
  }, [workflow]);

  // Ensure a visible height or the canvas won't show
  return (
    <canvas
  ref={canvasRef}
  className="w-full h-[600px] rounded border border-gray-300"
/>
  );
};

export default GraphCanvas;
