import { AppStore, LR0DFAStore, RFHeightSelector, RFSelector, RFTableStore } from "../../state";
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

export default function LR0DFA() {
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
  } = LR0DFAStore(RFSelector, shallow);

  AppStore.subscribe(
    (state) => state.grammar,
    () => {resetStore()}
  )

  let edgesLeft = false;
  let tableData = null;
  let tableHeaders = null;

  if (grammar !== null) {
    // if LR0 graph has not been generated then generate it
    if (grammar.lr0DFAGraph === null) {
      grammar.getLR0DFA();
    }
    // if table exists then get table data
    if (grammar.lr0DFATable !== null) {
      tableData = Array.from(grammar.lr0DFATable);
      tableHeaders = tableData.shift();
    }
    // if react flow graph is empty add the first node
    if (nodes.length === 0) {
        let LR0DFAGraph = grammar.lr0DFAGraph as LR0Graph;
        if (LR0DFAGraph.unAddedNodes.length > 0) {
          let newNode = LR0DFAGraph.unAddedNodes.shift();
          if (newNode) {
            addNode(newNode);
          }
        }
    }
    // check if there are any edges left to add (controls add button on react flow)
    edgesLeft = grammar.lr0DFAGraph!.unAddedEdges.length > 0;
  }

  function handleAdd() {
    if (grammar !== null && grammar.lr0DFAGraph !== null) {
      if (grammar.lr0DFAGraph.unAddedEdges.length < 1) {
        return;
      }
      let newEdge = grammar.lr0DFAGraph.unAddedEdges.shift() as Edge;
      const newNodes: ItemSetNodeType[] = [];

      // check if source node already exists
      let sourceNode = nodes.find((node) => node.id === newEdge.source);
      if (!sourceNode) {
        let newNode = grammar.lr0DFAGraph.removeNode(newEdge.source);
        if (newNode) {
          newNodes.push(newNode);
        }
      }

      // check if target node already exists
      if (nodes.findIndex((node) => node.id === newEdge.target) === -1) {
        let newNode = grammar.lr0DFAGraph.removeNode(newEdge.target);
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
