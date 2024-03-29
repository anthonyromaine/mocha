import { AppStore, SLRStore, RFSelector, RFTableStore, RFHeightSelector, RFHeights } from "../../state";
import Grammar from "../Grammar/Grammar";
import Table from "../Table/Table";
import { ItemSetNodeType, nodeTypes } from "../ItemSetNode/ItemSetNode";
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { shallow } from "zustand/shallow";
import { LR0Graph } from "../../models/LR0Graph";
import RFAddButton from "../RFAddButton/RFAddButton";
import { NODE_POSITION_DIFFERENCE, RFProOptions } from "../../types";
import RFHeightButton from "../RFHeightButton/RFHeightButton";
import TableHeightButton from "../TableHeightButton/TableHeightButton";

export default function SLR() {
  const grammar = AppStore((state) => state.grammar);
  const {tableHeight, rfHeight} = RFTableStore(RFHeightSelector, shallow)
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    addEdge,
    resetStore
  } = SLRStore(RFSelector, shallow);

  AppStore.subscribe(
    (state) => state.grammar,
    () => {resetStore()}
  )

  let edgesLeft = false;
  let tableData = null;
  let tableHeaders = null;

  if (grammar !== null) {
    // if SLR graph has not been generated then generate it
    if (grammar.slrGraph === null) {
      grammar.getSLR();
    }
    // if table exists then get table data
    if (grammar.slrTable !== null) {
      tableData = Array.from(grammar.slrTable);
      tableHeaders = tableData.shift();
    }
    // if react flow graph is empty add the first node
    if (grammar.slrGraph !== null){
      if (nodes.length === 0) {
        let SLRGraph = grammar.slrGraph as LR0Graph;
        if (SLRGraph.unAddedNodes.length > 0) {
          let newNode = SLRGraph.unAddedNodes.shift();
          if (newNode) {
            addNode(newNode);
          }
        }
      }
      // check if there are any edges left to add (controls add button on react flow)
      edgesLeft = grammar.slrGraph!.unAddedEdges.length > 0;
    }
    
  }

  function handleAdd() {
    if (grammar !== null && grammar.slrGraph !== null) {
      if (grammar.slrGraph.unAddedEdges.length < 1) {
        return;
      }
      let newEdge = grammar.slrGraph.unAddedEdges.shift() as Edge;
      const newNodes: ItemSetNodeType[] = [];

      // check if source node already exists
      let sourceNode = nodes.find((node) => node.id === newEdge.source);
      if (!sourceNode) {
        let newNode = grammar.slrGraph.removeNode(newEdge.source);
        if (newNode) {
          newNodes.push(newNode);
        }
      }

      // check if target node already exists
      if (nodes.findIndex((node) => node.id === newEdge.target) === -1) {
        let newNode = grammar.slrGraph.removeNode(newEdge.target);
        if (newNode) {
          // add new node next to source node on graph
          if (sourceNode) {
            newNode.position.x = sourceNode.position.x + NODE_POSITION_DIFFERENCE;
            newNode.position.y = sourceNode.position.y + NODE_POSITION_DIFFERENCE;
          }
          newNodes.push(newNode);
        }
      }

      addEdge(newEdge, newNodes);
    }
  }

  return (
    <div className="flex flex-1 max-h-[calc(100vh-56px)] overflow-hidden">
      <Grammar />
      <div className="flex-1 max-h-[calc(100vh-56px)] overflow-hidden">
        <div className={`w-full ${rfHeight} transition-[height]`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            proOptions={RFProOptions}
          >
            {edgesLeft ? (
              <RFAddButton onClick={handleAdd} />
            ) : null}
            
            <RFHeightButton />
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        <div className={`relative w-full ${tableHeight} transition-[height]`}>
          <TableHeightButton />
          {grammar && tableData ? (
            <Table headers={tableHeaders} rows={tableData} />
          ): null}
        </div>
        
      </div>
    </div>
  );
}
