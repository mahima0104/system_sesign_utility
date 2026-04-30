import { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom styled node
function ServiceNode({ data }: { data: { label: string; icon: string; sublabel?: string; color?: string } }) {
  const color = data.color ?? '#2563eb';
  return (
    <div
      className="px-4 py-3 rounded-xl border-2 bg-gray-900 min-w-[120px] text-center shadow-lg"
      style={{ borderColor: color }}
    >
      <div className="text-2xl mb-1">{data.icon}</div>
      <div className="text-white text-sm font-semibold">{data.label}</div>
      {data.sublabel && <div className="text-gray-400 text-xs mt-0.5">{data.sublabel}</div>}
    </div>
  );
}

const nodeTypes = { service: ServiceNode };

interface Props {
  initialNodes: Node[];
  initialEdges: Edge[];
  height?: number;
  readonly?: boolean;
}

export default function ArchitectureDiagram({
  initialNodes,
  initialEdges,
  height = 400,
  readonly = false,
}: Props) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-gray-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readonly ? undefined : onNodesChange}
        onEdgesChange={readonly ? undefined : onEdgesChange}
        onConnect={readonly ? undefined : onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1f2937" />
        <Controls className="!bg-gray-900 !border-gray-700" />
        <MiniMap
          nodeColor={() => '#2563eb'}
          maskColor="rgba(3,7,18,0.7)"
          className="!bg-gray-900 !border-gray-700"
        />
      </ReactFlow>
    </div>
  );
}
